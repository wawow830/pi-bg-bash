import { createBashToolDefinition, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
	const { outputSchema, ...bash } = createBashToolDefinition(process.cwd());
	const running = new Set<AbortController>();

	pi.registerTool({
		...bash,
		description: `${bash.description} Optionally set background: true to run without waiting, and its output will be returned when it exits.`,
		parameters: Type.Object({
			...bash.parameters.properties,
			background: Type.Optional(Type.Boolean({ description: "Run without waiting (optional, default false)" })),
		}),
		async execute(id, { background, ...params }, signal, onUpdate, ctx) {
			if (!background) return bash.execute(id, params, signal, onUpdate, ctx);
			const controller = new AbortController();
			running.add(controller);
			bash.execute(id, params, controller.signal, undefined, ctx).then((result) => {
				running.delete(controller);
				if (controller.signal.aborted) return;
				const { output, exit_code, full_output_path } = result.structuredContent as any;
				let text = `Background command finished: \`${params.command}\`\n${output ? `\`\`\`\n${output}\n\`\`\`` : "(no output)"}`;
				if (exit_code) text += `\n\nCommand exited with code ${exit_code}`;
				if (full_output_path) text += `\n\n[Output truncated. Full output: ${full_output_path}]`;
				pi.sendMessage(
					{ customType: "bash", content: text, display: true },
					{ triggerTurn: true, deliverAs: "steer" },
				);
			});
			return { content: [{ type: "text", text: "Running in background. Output will be sent when it exits." }], details: undefined };
		},
	});

	pi.on("session_shutdown", () => running.forEach((c) => c.abort()));
}
