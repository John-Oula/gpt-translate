"use client";
import { useRef, useState } from "react";
import { useToast} from "@chakra-ui/react";
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
import { read, utils } from "xlsx";
import TextBox from "./Components/Textbox";

export default function Home() {
  const [fileData, setFileData] = useState();
  const toast = useToast()

  const handleFileDrop = (event) => {
    try {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = function (e) {
        const workbook = read(new Uint8Array(e.target.result), { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = utils.sheet_to_json(worksheet, { header: 1 });
  
        // Extract data from "source" and "target" headers
        const headers = data[0];
        const sourceIndex = headers.indexOf("Source");
        const translationIndex = headers.indexOf("Target");
  
        if (sourceIndex !== -1 && translationIndex !== -1) {
          const extractedData = data.slice(1).map((row) => ({
            source: row[sourceIndex],
            target: row[translationIndex],
          }));
  
          setFileData(extractedData);
        } else {
          throw new Error("Required headers not found")
        }
      };
      reader.readAsArrayBuffer(file);
      
    } catch (error) {
      toast({
        title: error.message,
        duration: 5000,
        status: "warning",
        description:"",
              })
    }
 
  };
  return (
    <Flex
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
        {!fileData ? (
          <DragFile />
        ) : (
          <Table
            colorScheme={"whiteAlpha"}
            mt={"2%"}
            variant="striped"
          >
            <Thead>
              <Tr>
                <Th>Source</Th>
                <Th>Target</Th>
              </Tr>
            </Thead>
            <Tbody w={50}>
              {fileData?.slice(0, 100).map((each, i) => {
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
        )}
      </TableContainer>
    </Flex>
  );
}
