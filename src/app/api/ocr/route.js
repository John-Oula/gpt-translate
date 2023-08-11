// api/generate/route.js
import { OcrStream } from "../../lib/OcrStream";
import formidable from 'formidable';

export const config = {
  runtime: "edge",
  api: {
    bodyParser: false
  }
};


export async function POST(req) {
  const  file  = await req.formData()


  console.log(file);

//   const payload = {
//     file: file

//   };

  const stream = await OcrStream(file);

  const res = new Response(stream);

  return res;
}
