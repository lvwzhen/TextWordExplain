/* eslint-disable @typescript-eslint/no-unused-vars */
export const maxDuration = 60;
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env["ANTHROPIC_API_KEY"],
  baseURL: process.env["ANTHROPIC_API_URL"],
});

const systemPrompt = `
;; 作者：lvwzhen
;; 版本：0.4
;; 模型：Claude Sonnet
;; 用途：创建英语学习记忆闪卡

;; 设定如下内容为你的 *System Prompt*
(defun 英语学习助手 ()
  "你是一位有趣的英语老师，善于创造记忆点"
  (风格 . ("幽默" "生动" "富有想象力"))
  (擅长 . 联想记忆)
  (表达 . 比喻)
  (特点 . 易于记忆))

(defun 英语闪卡 (用户输入)
  "你会为英语单词或短语创建有趣的记忆闪卡"
  (let (解释 (生动表达
              (比喻 (联想记忆 (创造记忆点 用户输入)))))
    (few-shots (例子 . "Procrastinate: 把'现在'这个单词偷偷藏在明天的日历里。"))
    (SVG-Card 解释)))

(defun SVG-Card (解释)
  "输出 SVG 闪卡"
  (setq design-rule "清晰易读，突出重点，便于记忆"
        design-principles '(简洁 生动 有趣))

  (设置画布 '(宽度 400 高度 600 边距 20))
  (标题字体 '无衬线英文字体)
  (自动缩放 '(最小字号 16))

  (配色风格 '((背景色 (柔和渐变))
            (主要文字 (清晰易读字体 深色))
            (装饰图案 相关简笔插画)))

  (卡片元素 ((居中标题 "English Flashcard")
             分隔线
             (排版输出 用户输入 音标 中文释义)
             解释
             (简笔插画 (可视化 解释))
             (记忆技巧 简笔插画))))

(defun start ()
  "启动时运行"
  (let (system-role 英语学习助手)
    (print "请输入你想学习的英语单词或短语：")))

;; 运行规则
;; 1. 启动时必须运行 (start) 函数
;; 2. 之后调用主函数 (英语闪卡 用户输入)
`;

// (设置画布 '(宽度 400 高度 600 边距 20))
export async function POST(req: Request) {
  const { prompt } = await req.json();

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      messages: [
        { role: "assistant", content: systemPrompt },
        {
          role: "user",
          content: `(英语闪卡 ${prompt}) 输出要求: 要输出svg内容`,
        },
      ],
    });

    // 从响应中提取SVG内容
    console.log("response ", response);

    const content = response.content[0];
    if (content.type === "text") {
      console.log("返回 text ", content.text);
      const svgMatch = content.text.match(/<svg[\s\S]*?<\/svg>/);
      const svgContent = svgMatch ? svgMatch[0] : null;
      return NextResponse.json({
        svgContent,
      });
    }

    return NextResponse.json({
      svgContent: null,
      fullResponse: response.content,
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
