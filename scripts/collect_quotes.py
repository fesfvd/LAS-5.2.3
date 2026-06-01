"""从已完成分析中收集金句到 quotes.json。用法: cd /www/wwwroot/lasystem.cn && python scripts/collect_quotes.py [--mode classic|original] [--dry]"""
import argparse, json, os, sys

_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _BASE)
sys.path.insert(0, os.path.join(_BASE, "backend"))
from models.orm import SessionLocal, Analysis, Work


def main():
    parser = argparse.ArgumentParser(description="从分析记录收集金句到句子库")
    parser.add_argument("--mode", default="classic", choices=["classic", "original", "all"])
    parser.add_argument("--dry", action="store_true", help="只预览不写入")
    args = parser.parse_args()

    db = SessionLocal()

    # Query completed analyses
    q = db.query(Analysis).filter(Analysis.status == "done", Analysis.report_json.isnot(None))
    analyses = q.order_by(Analysis.created_at.desc()).all()
    print(f"找到 {len(analyses)} 条已完成分析")

    # Load existing quotes
    quote_file = os.path.join(os.path.dirname(__file__), "..", "data", "quotes.json")
    if not os.path.exists(quote_file):
        quote_file = os.path.join(os.path.dirname(__file__), "..", "frontend", "quotes.json")
    with open(quote_file, "r", encoding="utf-8") as f:
        existing = json.load(f)
    existing_texts = {item["t"].strip() for item in existing}
    print(f"现有句子库: {len(existing)} 条")

    new_count = 0
    for a in analyses:
        work = a.work
        if not work:
            continue
        mode = work.mode or "classic"
        if args.mode != "all" and mode != args.mode:
            continue

        report = a.report_json or {}
        ac = report.get("analysis_content", {})
        quote = (ac.get("golden_quote") or "").strip()
        if len(quote) < 4:
            continue
        if quote in existing_texts:
            continue

        source = (work.title or "") + " " + (work.author or "")
        entry = {"t": quote, "s": source.strip(), "m": mode}
        existing_texts.add(quote)

        if args.dry:
            print(f"  [{mode}] {quote[:50]}...  —— {source.strip()}")
        else:
            existing.append(entry)
        new_count += 1

    if not args.dry and new_count > 0:
        with open(quote_file, "w", encoding="utf-8") as f:
            json.dump(existing, f, ensure_ascii=False, indent=2)
        print(f"已写入 {quote_file}")

    print(f"新增 {new_count} 条，总计 {len(existing)} 条")
    db.close()


if __name__ == "__main__":
    main()
