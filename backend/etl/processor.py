import trafilatura
import hashlib
import re
from typing import List, Dict, Tuple
from backend.schemas import Chunk

class ContentProcessor:
    def __init__(self):
        pass

    def compute_md5(self, content: str) -> str:
        return hashlib.md5(content.encode('utf-8')).hexdigest()

    def process_url(self, url: str, html_content: str) -> List[Chunk]:
        """
        Full pipeline: Clean -> Chunk -> Inject Metadata
        """
        # 1. Smart Cleaning
        clean_text = self._clean_html(html_content)
        if not clean_text or len(clean_text) < 100:
            return []

        # 2. Semantic Chunking (Header Split)
        raw_chunks = self._markdown_header_split(clean_text)

        # 3. Metadata Injection
        final_chunks = []
        title = self._extract_title(html_content)
        import datetime
        current_date = datetime.datetime.now().strftime("%Y-%m-%d")
        
        for i, (header_path, content) in enumerate(raw_chunks):
            # Calculate a unique ID for the chunk
            chunk_id = self.compute_md5(f"{url}_{i}")
            
            # Injection Format: [Source: Title] [Date: YYYY-MM-DD] [Context: Header] Content
            injected_content = f"[Source: {title}] [Date: {current_date}] [Context: {header_path}]\n{content}"
            
            final_chunks.append(Chunk(
                id=chunk_id,
                content=injected_content,
                metadata={
                    "url": url,
                    "title": title,
                    "header_path": header_path,
                    "original_md5": self.compute_md5(content)
                }
            ))
            
        return final_chunks

    def _clean_html(self, html: str) -> str:
        # Use trafilatura for main content extraction
        return trafilatura.extract(html, include_comments=False, include_tables=True, output_format='markdown')

    def _extract_title(self, html: str) -> str:
        # Simple regex or trafilatura title
        # fallback to simple regex if trafilatura fails to extract metadata specifically
        match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
        return match.group(1).strip() if match else "Unknown Title"

    def _markdown_header_split(self, markdown_text: str) -> List[Tuple[str, str]]:
        """
        Splits markdown by headers (H1, H2, H3).
        Returns list of (header_path, content).
        Example: ("# Introduction > ## Setup", "Content...")
        """
        lines = markdown_text.split('\n')
        chunks = []
        current_path = [] # Stack of headers
        current_content = []
        
        # Regex to detect headers
        header_re = re.compile(r'^(#{1,3})\s+(.*)')
        
        for line in lines:
            match = header_re.match(line)
            if match:
                # If we have content accumulating, save it
                if current_content:
                    path_str = " > ".join([p[1] for p in current_path])
                    chunks.append((path_str, "\n".join(current_content).strip()))
                    current_content = []
                
                level = len(match.group(1))
                title = match.group(2).strip()
                
                # Maintain proper hierarchy stack
                # 1. Pop headers that are same level or deeper (higher number) to close that section
                # e.g. if we are at H2, we pop previous H2s and H3s. H1 stays.
                while current_path and current_path[-1][0] >= level:
                    current_path.pop()
                
                # 2. Push new header
                current_path.append((level, title))
                
                # 3. Construct path string for metadata
                # Just use the titles
                path_str = " > ".join([p[1] for p in current_path])
                
                # Note: We don't update 'current_path' variable directly because we changed logic 
                # to store tuples. We need to adapt the chunk appending logic below as well.
                # Let's adjust the structure of this loop slightly. 
                
                current_content.append(line) # Include the header in the chunk text too? Yes.
            else:
                current_content.append(line)
                
        # Flush last chunk
        if current_content:
            path_str = " > ".join([p[1] for p in current_path]) if current_path else "Root"
            chunks.append((path_str, "\n".join(current_content).strip()))
            
        return chunks
