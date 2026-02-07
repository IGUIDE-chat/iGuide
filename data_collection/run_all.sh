#!/bin/bash

echo "🚀 第一阶段：启动极速爬虫..."
python main.py

echo "--------------------------------"
echo "⏸️ 爬取完成。休息 3 秒..."
sleep 3

echo "🧠 第二阶段：启动 AI 智能归类..."
# 这一步会比较慢，耐心等待
python reorganize_ai.py

echo "🎉 全部完成！知识库已更新。"