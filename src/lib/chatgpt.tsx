export async function streamChatGPT(prompt: string, onDelta: (token: string) => void): Promise<void> {
  const apiKey = "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"; // your OpenRouter key

try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost", // Change in prod
        "X-Title": "AI Lead Assistant",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        stream: true,
        messages: [
          {
            role: "system",
            content: "You are an AI assistant for lead management. Answer clearly and helpfully.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok || !res.body) {
      const errorText = await res.text();
      console.error("❌ OpenRouter stream error:", errorText);
      onDelta("⚠️ Stream failed to start.");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n");

      // Only keep the last partial line in the buffer
      buffer = parts.pop() || "";

      for (const line of parts) {
        if (!line.startsWith("data:")) continue;

        const jsonStr = line.replace("data: ", "").trim();

        if (jsonStr === "[DONE]") return;

        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) onDelta(delta);
        } catch (err) {
          console.warn("⚠️ Stream parse error:", jsonStr, err);
          continue;
        }
      }
    }
  } catch (err) {
    console.error("❌ Streaming failed:", err);
    onDelta("⚠️ Stream interrupted.");
  }
}