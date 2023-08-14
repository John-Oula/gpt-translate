"use client";
import { useState } from "react";
import { Box, Image, useToast } from "@chakra-ui/react";
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
import { fetchEventSource } from "@microsoft/fetch-event-source";
import TextBox from "./Components/Textbox";

export default function Home() {
  const [fileData, setFileData] = useState([]);
  const [comicPreview, setComicPreview] = useState(null);
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const sendImage = async (imageFile) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      await fetchEventSource("http://127.0.0.1:8000/api/ocr", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "text/event-stream",
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
          if (event.data) {
            const parsedData = JSON.parse(event.data);
            setFileData((data) => [...data, parsedData]);
          }
        },
        onclose() {
          setLoading(false);
          console.log("Connection closed by the server");
        },
        onerror(err) {
          setLoading(false);
          console.log("There was an error from server", err);
        },
      });
    } catch (error) {
      setLoading(false);
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

      setComicPreview(imageUrl);
      await sendImage(file).catch((err) => console.log(err.message));
    } catch (error) {
      toast({
        title: error.message,
        duration: 5000,
        status: "warning",
        description: "",
      });
    }
  };


  return (
    <Flex
      overflowY={"hidden"}
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
      <Box h={"100vh"} width={"100%"}>
        {!comicPreview ? (
          <DragFile />
        ) : (
          <Flex h={"100vh"}>
            {comicPreview && (
              <>
                <Image
                  h={"auto"}
                  w={"auto"}
                  maxW={"50%"}
                  src={comicPreview}
                  alt="preview"
                />
              </>
            )}
            <TableContainer overflowY={"scroll"} width={"70%"}>
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
            </TableContainer>
          </Flex>
        )}
      </Box>
    </Flex>
  );
}
