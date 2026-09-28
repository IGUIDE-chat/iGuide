from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

try:
    import numpy as np
    import pypdfium2 as pdfium
    from rapidocr_onnxruntime import RapidOCR
except ModuleNotFoundError as exc:
    print(
        "Missing OCR dependency. Install with: "
        "python -m pip install pypdfium2 rapidocr-onnxruntime",
        file=sys.stderr,
    )
    raise SystemExit(1) from exc


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = PROJECT_ROOT / "docs"


@dataclass(frozen=True)
class Chapter:
    title: str
    title_en: str
    start_page: int
    end_page: int


CHAPTERS: tuple[Chapter, ...] = (
    Chapter("引言", "Introduction", 3, 3),
    Chapter("I-20及签证篇", "I-20 and Visa", 4, 7),
    Chapter("入学测试篇", "Entrance Test", 8, 9),
    Chapter("选课篇", "Course Selection", 10, 12),
    Chapter("体检疫苗篇", "Physical Examination and Vaccination", 13, 17),
    Chapter("学费篇", "Tuition Fees", 18, 19),
    Chapter("宿舍篇", "Dormitory", 20, 26),
    Chapter("交通篇", "Transportation", 27, 29),
    Chapter("行李准备篇", "Prepare Your Luggage", 30, 32),
    Chapter("附录：MyIllini清单", "Appendix: MyIllini Checklist", 33, 33),
)


def find_handbook_pdf(explicit_path: str | None) -> Path:
    if explicit_path:
        pdf_path = Path(explicit_path).resolve()
        if not pdf_path.exists():
            raise FileNotFoundError(f"Handbook PDF not found: {pdf_path}")
        return pdf_path

    candidates = sorted(DOCS_DIR.glob("*新生手册*.pdf"))
    if not candidates:
        candidates = sorted(DOCS_DIR.glob("*.pdf"))

    if not candidates:
        raise FileNotFoundError(f"No handbook PDF found under {DOCS_DIR}")

    return candidates[0]


def normalize_inline_text(text: str) -> str:
    value = text.replace("\u3000", " ").strip()
    value = re.sub(r"\s+", " ", value)
    return value


def clean_page_lines(lines: list[str]) -> list[str]:
    cleaned: list[str] = []
    for line in lines:
        value = line.strip()
        if not value:
            continue
        if re.fullmatch(r"\d+", value):
            continue
        if re.fullmatch(r"\d+\s+\d+", value):
            continue
        if cleaned and cleaned[-1] == value:
            continue
        cleaned.append(value)
    return cleaned


def extract_text_by_page(pdf_path: Path) -> list[list[str]]:
    pdf = pdfium.PdfDocument(str(pdf_path))
    ocr = RapidOCR()
    pages: list[list[str]] = []

    for index in range(len(pdf)):
        page = pdf[index]
        image = page.render(scale=2.4).to_pil()
        results, _ = ocr(np.array(image))
        lines: list[str] = []

        if results:
            items = sorted(
                results,
                key=lambda item: (
                    min(point[1] for point in item[0]),
                    min(point[0] for point in item[0]),
                ),
            )

            grouped: list[tuple[float, list[tuple[float, str]]]] = []
            threshold = max(18.0, image.size[1] * 0.008)

            for box, text, _score in items:
                value = normalize_inline_text(text)
                if not value:
                    continue

                x = min(point[0] for point in box)
                y = min(point[1] for point in box)

                if grouped and abs(y - grouped[-1][0]) <= threshold:
                    grouped[-1][1].append((x, value))
                else:
                    grouped.append((y, [(x, value)]))

            for _y, row in grouped:
                line = " ".join(text for _, text in sorted(row, key=lambda item: item[0])).strip()
                if line:
                    lines.append(line)

        pages.append(clean_page_lines(lines))
        print(f"processed page {index + 1}/{len(pdf)}")

    return pages


def render_frontmatter(pdf_path: Path, updated_at: str) -> str:
    source_path = pdf_path.relative_to(PROJECT_ROOT).as_posix()
    return "\n".join(
        [
            "---",
            'id: "uiuc-new-student-handbook-2025"',
            'type: "handbook"',
            'lang: "zh"',
            f'source: "{source_path}"',
            'title: "UIUC CSSA 2025 新生手册（OCR转写）"',
            f'updated_at: "{updated_at}"',
            "---",
            "",
        ]
    )


def build_markdown(pdf_path: Path, pages: list[list[str]]) -> str:
    updated_at = datetime.fromtimestamp(pdf_path.stat().st_mtime).date().isoformat()
    toc_lines = [f"- {chapter.title} / {chapter.title_en}" for chapter in CHAPTERS]
    body: list[str] = [
        render_frontmatter(pdf_path, updated_at),
        "> 说明：此文件由扫描版 PDF 经 OCR 转写生成，主要用于 QMD 检索与知识入库。少量段落可能存在识别误差，请以原始 PDF 为准。",
        "",
        "## 目录",
        "",
        *toc_lines,
        "",
    ]

    for chapter in CHAPTERS:
        body.extend(
            [
                f"## {chapter.title}",
                "",
                f"*{chapter.title_en}*",
                "",
            ]
        )

        for page_number in range(chapter.start_page, chapter.end_page + 1):
            page_index = page_number - 1
            body.append(f"### PDF 第 {page_number} 页")
            body.append("")
            body.extend(pages[page_index])
            body.append("")

    return "\n".join(body).rstrip() + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="OCR the scanned UIUC handbook into Markdown.")
    parser.add_argument("--input", help="Path to the source PDF. Defaults to docs/*新生手册*.pdf.")
    parser.add_argument("--output", required=True, help="Path to the output Markdown file.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    pdf_path = find_handbook_pdf(args.input)
    pages = extract_text_by_page(pdf_path)
    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(build_markdown(pdf_path, pages), encoding="utf-8")
    print(f"written {output_path}")


if __name__ == "__main__":
    main()
