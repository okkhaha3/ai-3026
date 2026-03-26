import { v4 as uuidv4 } from 'uuid';

export interface Chapter {
  id: string;
  title: string;
  content: string;
  level: number;
}

export function parseMarkdownToChapters(markdown: string): Chapter[] {
  const lines = markdown.split('\n');
  const chapters: Chapter[] = [];
  
  let currentChapter: Chapter = {
    id: uuidv4(),
    title: 'Introduction',
    content: '',
    level: 1,
  };

  const headingRegex = /^(#{1,3})\s+(.*)$/;

  for (const line of lines) {
    const match = line.match(headingRegex);
    if (match) {
      // If we found a new heading, push the current chapter if it has content
      // or if it's not the default empty introduction
      if (currentChapter.content.trim() || currentChapter.title !== 'Introduction') {
        chapters.push({ ...currentChapter, content: currentChapter.content.trim() });
      }
      
      const level = match[1].length;
      const title = match[2].trim();
      
      currentChapter = {
        id: uuidv4(),
        title,
        content: line + '\n', // Include the heading in the content for rendering
        level,
      };
    } else {
      currentChapter.content += line + '\n';
    }
  }

  // Push the last chapter
  if (currentChapter.content.trim()) {
    chapters.push({ ...currentChapter, content: currentChapter.content.trim() });
  }

  return chapters;
}
