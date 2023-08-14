"use client";
import { useEffect, useState } from "react";
import { Image, useToast } from "@chakra-ui/react";
import DragFile from "./Components/DragFile";
import {
  Flex,
  Table,
  TableContainer,
  Tbody,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import axios from "axios";
import { fetchEventSource } from '@microsoft/fetch-event-source';
import TextBox from "./Components/Textbox";

export default function Home() {
  const [fileData, setFileData] = useState([]);
  const [comic, setComic] = useState(null);
  const [ocr, setOcr] = useState([]);
  const toast = useToast();
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(false);

  const sendImage = async (imageFile) => {
    setLoading(true)
    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      
      await fetchEventSource("http://127.0.0.1:8000/api/ocr", {
        method: "POST",
        body:formData,
        headers: {
          "Accept": "text/event-stream",

        },
        onopen(res) {
          if (res.ok && res.status === 200) {
            console.log("Connection made ", res);
          } else if (
            res.status >= 400 &&
            res.status < 500 &&
            res.status !== 429
          ) {
            console.log("Client side error ", res);
          }
        },
        onmessage(event) {
          console.log(event.data);
          const parsedData = JSON.parse(event.data);
          setFileData((data) => [...data, parsedData]);
          console.log(parsedData);

        },
        onclose() {
          setLoading(false)
          console.log("Connection closed by the server");
        },
        onerror(err) {
          setLoading(false)
          console.log("There was an error from server", err);
        },
      });
    
    } catch (error) {
      setLoading(false)
      console.error("Error sending image:", error);

      toast({
        title: error.message,
        duration: 5000,
        status: "warning",
        description: "",
      });
    }
  };

  const handleFileDrop = async (event) => {
    try {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      const imageUrl = URL.createObjectURL(file);

      setComic(imageUrl);
      await sendImage(file)
        .then((data) => {
          setOcr(data.data);

          // translate(JSON.stringify(data));
        })
        .catch((err) => console.log(err.message));
    } catch (error) {
      toast({
        title: error.message,
        duration: 5000,
        status: "warning",
        description: "",
      });
    }
  };

  const translate = async (comicData) => {
    setTranslation("");
    setLoading(true);

    const systemMsg = `You are a veteran translator.
    You will be provided with short sentences to translate.
    You have these requirements:
    1. Translate the short sentences into English.
    3. Provide the same json structure. 
    4. Do not use quotes, unless if they are part of the provided text.`;

    const prompt = [
      { role: "system", content: systemMsg },
      {
        role: "user",
        content: `Translate the following to English: ${comicData}`,
      },
    ];
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      setLoading(false);
      throw new Error(response.statusText);
    }

    const data = response.body;
    if (!data) {
      return;
    }
    const reader = data.getReader();
    const decoder = new TextDecoder();
    let isDone = false;

    while (!isDone) {
      const { value, done } = await reader.read();
      isDone = done;
      const chunkValue = decoder.decode(value);
      setTranslation((prev) => prev + chunkValue);
      console.log(chunkValue);
    }

    setLoading(false);
  };

  return (
    <Flex
      position={"relative"}
      justifyContent={"center"}
      bg={"black.400"}
      h={"100%"}
      w={"100%"}
      color={"#D1D5DB"}
      onDrop={handleFileDrop}
      onDragOver={(event) => {
        event.preventDefault();
        event.target.style.backgroundColor = "#ffffff20";
      }}
    >
      <TableContainer h={"100%"} width={"100%"}>
        {!comic ? (
          <DragFile />
        ) : (
          <Flex h={"100%"}>
            {comic && 
            <>
             <Image h={'100vh'} w={'50%'} src={comic} alt="preview" />
            </>}
            <Table colorScheme={"whiteAlpha"} mt={"2%"} variant="striped">
              <Thead>
                <Tr>
                  <Th>Source</Th>
                  <Th>Target</Th>
                </Tr>
              </Thead>
              <Tbody w={50}>

              {fileData.map((each, i) => {
                return (
                  each?.source && (
                    <TextBox
                      index={i}
                      source={each?.source}
                      target={each?.target}
                      key={i}
                    />
                  )
                );
              })}
              </Tbody>
            </Table>
          </Flex>
        )}
      </TableContainer>
    </Flex>
  );
}
