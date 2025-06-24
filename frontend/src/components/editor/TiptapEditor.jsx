// components/editor/TiptapEditor.jsx - 개선된 버전
import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { 
  Bold, Italic, Strikethrough, Code, List, ListOrdered, 
  Quote, Undo, Redo, Image as ImageIcon, Link as LinkIcon,
  Upload, Heading1, Heading2, FileText, AlertCircle
} from 'lucide-react';
import { fileManager, formatFileSize } from '../../utils/fileManager';

// 툴바 버튼 컴포넌트
const ToolbarButton = ({ onClick, isActive, disabled, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded hover:bg-gray-100 transition-colors ${
      isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

// 구분선 컴포넌트
const Divider = () => <div className="w-px h-6 bg-gray-300 mx-1" />;

const TiptapEditor = ({ 
  content = '', 
  onChange, 
  placeholder = "내용을 입력하세요...",
  minHeight = 300 
}) => {
  const [tempFileCount, setTempFileCount] = React.useState(0);
  const [totalSize, setTotalSize] = React.useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      CharacterCount,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-4',
        style: `min-height: ${minHeight}px;`,
      },
    },
    immediatelyRender: false,
  });

  // 임시 파일 상태 업데이트
  const updateTempFileStats = useCallback(() => {
    setTempFileCount(fileManager.getTempFileCount());
    setTotalSize(fileManager.getTotalSize());
  }, []);

  // content prop이 변경될 때 에디터 내용 업데이트
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [editor, content]);

  // 에디터가 마운트되면 포커스
  useEffect(() => {
    if (editor) {
      setTimeout(() => {
        editor.commands.focus();
      }, 100);
    }
  }, [editor]);

  // 파일을 임시로 추가하는 함수
  const addTempFile = useCallback((file) => {
    const tempFileData = fileManager.addTempFile(file);
    updateTempFileStats();
    
    return tempFileData;
  }, [updateTempFileStats]);

  // 이미지 삽입 (임시 저장)
  const addImage = useCallback(async () => {
    if (!editor) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      
      for (const file of files) {
        // 파일 크기 체크 (10MB 제한)
        if (file.size > 10 * 1024 * 1024) {
          alert(`파일이 너무 큽니다: ${file.name} (최대 10MB)`);
          continue;
        }
        
        const tempFileData = addTempFile(file);
        
        if (tempFileData.type === 'image') {
          // 임시 URL로 이미지 삽입
          editor.chain().focus().setImage({ 
            src: tempFileData.tempUrl, 
            alt: tempFileData.filename,
            'data-temp-id': tempFileData.tempId // 나중에 실제 URL로 교체하기 위한 식별자
          }).run();
        }
      }
    };
    
    input.click();
  }, [editor, addTempFile]);

  // 파일 첨부 (임시 저장)
  const addFile = useCallback(async () => {
    if (!editor) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      
      for (const file of files) {
        // 파일 크기 체크 (10MB 제한)
        if (file.size > 10 * 1024 * 1024) {
          alert(`파일이 너무 큽니다: ${file.name} (최대 10MB)`);
          continue;
        }
        
        const tempFileData = addTempFile(file);
        
        if (tempFileData.type === 'image') {
          // 이미지는 이미지로 삽입
          editor.chain().focus().setImage({ 
            src: tempFileData.tempUrl, 
            alt: tempFileData.filename,
            'data-temp-id': tempFileData.tempId
          }).run();
        } else if (tempFileData.type === 'video') {
          // 비디오 삽입
          editor.chain().focus().insertContent(`
            <div class="my-4" data-temp-id="${tempFileData.tempId}">
              <video controls class="w-full max-w-2xl rounded-lg">
                <source src="${tempFileData.tempUrl}" type="${tempFileData.mime_type}">
                브라우저가 비디오를 지원하지 않습니다.
              </video>
              <p class="text-sm text-gray-500 mt-1">📹 ${tempFileData.filename} (${formatFileSize(tempFileData.size)})</p>
            </div>
          `).run();
        } else if (tempFileData.type === 'audio') {
          // 오디오 삽입
          editor.chain().focus().insertContent(`
            <div class="my-4" data-temp-id="${tempFileData.tempId}">
              <audio controls class="w-full">
                <source src="${tempFileData.tempUrl}" type="${tempFileData.mime_type}">
                브라우저가 오디오를 지원하지 않습니다.
              </audio>
              <p class="text-sm text-gray-500 mt-1">🎵 ${tempFileData.filename} (${formatFileSize(tempFileData.size)})</p>
            </div>
          `).run();
        } else {
          // 일반 파일은 다운로드 링크로 (임시 URL 사용)
          const fileSize = formatFileSize(tempFileData.size);
          editor.chain().focus().insertContent(`
            <div class="border border-gray-300 rounded-lg p-3 my-2 bg-gray-50 hover:bg-gray-100 transition-colors" data-temp-id="${tempFileData.tempId}">
              <div class="flex items-center space-x-2 text-gray-700">
                <span class="text-lg">📎</span>
                <div class="flex-1">
                  <div class="font-medium">${tempFileData.filename}</div>
                  <div class="text-sm text-gray-500">${fileSize} • 업로드 대기중</div>
                </div>
                <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">임시</span>
              </div>
            </div>
          `).run();
        }
      }
    };
    
    input.click();
  }, [editor, addTempFile]);

  // 링크 추가
  const addLink = useCallback(() => {
    if (!editor) return;
    
    const url = window.prompt('URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  // 드래그 앤 드롭 처리 (임시 저장)
  const handleDrop = useCallback(async (event) => {
    event.preventDefault();
    if (!editor) return;
    
    const files = Array.from(event.dataTransfer.files);
    
    for (const file of files) {
      // 파일 크기 체크
      if (file.size > 10 * 1024 * 1024) {
        alert(`파일이 너무 큽니다: ${file.name} (최대 10MB)`);
        continue;
      }
      
      const tempFileData = addTempFile(file);
      
      if (tempFileData.type === 'image') {
        editor.chain().focus().setImage({ 
          src: tempFileData.tempUrl, 
          alt: tempFileData.filename,
          'data-temp-id': tempFileData.tempId
        }).run();
      } else {
        // 다른 파일들은 addFile과 동일한 로직
        const fileSize = formatFileSize(tempFileData.size);
        editor.chain().focus().insertContent(`
          <div class="border border-gray-300 rounded-lg p-3 my-2 bg-gray-50" data-temp-id="${tempFileData.tempId}">
            <div class="flex items-center space-x-2 text-gray-700">
              <span class="text-lg">📎</span>
              <div class="flex-1">
                <div class="font-medium">${tempFileData.filename}</div>
                <div class="text-sm text-gray-500">${fileSize} • 업로드 대기중</div>
              </div>
              <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">임시</span>
            </div>
          </div>
        `).run();
      }
    }
  }, [editor, addTempFile]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-lg p-8 text-center text-gray-500">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
        에디터 로딩중...
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* 툴바 */}
      <div className="border-b border-gray-300 bg-gray-50 p-2 flex flex-wrap gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="제목 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="제목 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        
        <Divider />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="굵게 (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="기울임 (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="취소선"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="인라인 코드"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>
        
        <Divider />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="글머리 기호"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="번호 매기기"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="인용"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        
        <Divider />
        
        <ToolbarButton
          onClick={addImage}
          title="이미지 삽입 (임시 저장)"
        >
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={addFile}
          title="파일 첨부 (임시 저장)"
        >
          <Upload className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={addLink}
          title="링크 추가"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        
        <Divider />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="실행 취소 (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="다시 실행 (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>
      
      {/* 에디터 영역 */}
      <div 
        className="relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => editor.commands.focus()}
      >
        <EditorContent 
          editor={editor} 
          className="focus:outline-none [&_.ProseMirror]:focus:outline-none"
        />
        
        {/* 드래그 앤 드롭 안내 */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-blue-50 bg-opacity-50 border-2 border-dashed border-blue-300 rounded-lg m-2"
             style={{ minHeight: `${minHeight}px` }}>
          <div className="text-blue-600 text-center">
            <Upload className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">파일을 드래그해서 첨부하세요(최대 10MB)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TiptapEditor;