/**
 * @file ./src/components/chat/ThinkingProcess.tsx
 * @description Chat (AI) Component / Module
 * @description_zh 此文件属于 Chat 业务域。展示 AI 思考过程的可折叠组件。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThinkingStep } from "../../types";

interface ThinkingProcessProps {
	steps: ThinkingStep[];
	isThinking: boolean;
	isStreaming?: boolean;
	language?: "en" | "zh";
}

const stepIcons: Record<ThinkingStep["type"], string> = {
	reasoning: "💭",
	searching: "🔍",
	tool_call: "⚙️",
	processing: "📝",
};

const ThinkingDots = ({ disabled = false }: { disabled?: boolean }) => {
	if (disabled) return null;

	return (
		<span className="ml-1 inline-flex items-center gap-0.5">
			{[0, 1, 2].map((i) => (
				<motion.span
					key={i}
					className="size-1 rounded-full bg-illini-orange"
					animate={{ opacity: [0.3, 1, 0.3] }}
					transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
				/>
			))}
		</span>
	);
};

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({
	steps,
	isThinking,
	isStreaming = false,
	language = "zh",
}) => {
	const [isExpanded, setIsExpanded] = useState(true);
	const wasThinking = useRef(true);

	// Collapse immediately when streaming starts so layout below is stable
	useEffect(() => {
		if (isStreaming) {
			setIsExpanded(false);
		}
	}, [isStreaming]);

	// Auto-expand and then collapse after thinking completes and streaming ends
	useEffect(() => {
		if (wasThinking.current && !isThinking && !isStreaming) {
			setIsExpanded(true);
			const timer = setTimeout(() => setIsExpanded(false), 1500);
			return () => clearTimeout(timer);
		}
		wasThinking.current = isThinking;
	}, [isThinking, isStreaming]);

	if (steps.length === 0 && !isThinking) return null;

	const latestStep = steps[steps.length - 1];

	return (
		<div className="mb-2">
			<button
				type="button"
				onClick={() => setIsExpanded(!isExpanded)}
				className="
          group flex items-center gap-1.5 text-xs text-slate-500
          transition-colors
          hover:text-slate-700
        "
			>
				{isThinking ? (
					isStreaming ? (
						<div
							className="
                size-3.5 rounded-full border-2 border-illini-orange
                border-t-transparent opacity-80
              "
						/>
					) : (
						<motion.div
							className="
                size-3.5 rounded-full border-2 border-illini-orange
                border-t-transparent
              "
							animate={{ rotate: 360 }}
							transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
						/>
					)
				) : (
					<svg
						className="size-3.5 text-green-500"
						aria-hidden="true"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fillRule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clipRule="evenodd"
						/>
					</svg>
				)}
				<span className="font-medium">
					{isThinking
						? language === "zh"
							? "思考中"
							: "Thinking"
						: language === "zh"
							? "思考完成"
							: "Done thinking"}
				</span>
				{isThinking && latestStep && (
					<span className="text-slate-400">
						· {latestStep.label}
						<ThinkingDots disabled={isStreaming} />
					</span>
				)}
				<svg
					className={`
            size-3 transition-transform
            ${isExpanded ? "rotate-180" : ""}
          `}
					aria-hidden="true"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			<AnimatePresence>
				{isExpanded && steps.length > 0 && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="overflow-hidden"
					>
						<div className="mt-2 ml-1 space-y-1.5 border-l-2 border-slate-200 pl-3">
							{steps.map((step, index) => (
								<motion.div
									key={step.id}
									initial={{ opacity: 0, x: -8 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.2, delay: index * 0.05 }}
									className="flex items-start gap-1.5 text-xs text-slate-500"
								>
									<span className="mt-px shrink-0">{stepIcons[step.type]}</span>
									<div className="min-w-0">
										<span
											className={
												step.done ? "text-slate-400" : "text-slate-600"
											}
										>
											{step.label}
										</span>
										{step.detail && (
											<p className="mt-0.5 max-w-md truncate text-slate-400">
												{step.detail}
											</p>
										)}
									</div>
									{!step.done && isThinking && index === steps.length - 1 && (
										<ThinkingDots disabled={isStreaming} />
									)}
								</motion.div>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
