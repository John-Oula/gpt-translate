import { createParser } from "eventsource-parser";
import axios from "axios";

export async function OcrStream(payload) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let counter = 0;

  try {

    const res = await axios.post(
      "http://127.0.0.1:8000/api/ocr",
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log(res.ok);
    if (res?.ok) {
      const stream = new ReadableStream({
        async start(controller) {
          function onParse(event) {
            console.log(event);
            if (event.type === "event") {
              const data = event.data;
              // if (data === "[DONE]") {
              //   controller.close();
              //   return;
              // }
              try {
                const json = JSON.parse(data);
                console.log(json);

                // if (counter < 2 && (text?.match(/\n/) || []).length) {
                //   return;
                // }
                // const queue = encoder.encode(text);
                // controller.enqueue(queue);
                counter++;
              } catch (e) {
                controller.error(e);
                console.error(e.message);
              }
            }
          }

          // stream response (SSE) from OpenAI may be fragmented into multiple chunks
          // this ensures we properly read chunks & invoke an event for each SSE event stream
          const parser = createParser(onParse);

          // https://web.dev/streams/#asynchronous-iteration
          for await (const chunk of res.body) {
            parser.feed(decoder.decode(chunk));
          }
        },
      });

      return stream;
    } else {
      
      return res;
    }
  } catch (error) {
    console.log(error);
  }
}
