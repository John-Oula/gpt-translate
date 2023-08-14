import {
  Button,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  Td,
  Tr,
  Collapse,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { RiTranslate2 } from "react-icons/ri";
import { TailSpin } from "react-loader-spinner";

export default function TextBox({ source, index }) {
  const [translation, setTranslation] = useState("");
  const { isOpen, onToggle } = useDisclosure();
  const [translated, setTranslated] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Translate the source text function
  const translate = async (id) => {
    const text = document.getElementById(id).innerText;
    setTranslation("");
    setTranslated(false);
    setLoading(true);
    try {
      const systemMsg = `You are a veteran comic translator.
      You will be provided with short sentences to translate.
      You have these requirements:
      1. Translate the short sentences into English.
      2. Aside from the translation, do not provide any other output. 
      3. Do not use quotes, unless if they are part of the provided text.`;
  
      const prompt = [
        { role: "system", content: systemMsg },
        {
          role: "user",
          content: `Translate the following to English: ${text}`,
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
        const err = await response.json();
        console.log(err);
        throw new Error(err.error);
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
        setTranslation((prev) => prev + chunkValue)
      
      }
      setLoading(false);
      setTranslated(true);
    } catch (error) {
      toast({
        // id,
        title: error.message,
        duration: 7000,
        status: "warning",
        description: "",
      });
      setLoading(false);
    }
  };
 
  // Call translation function if source text is updated
  useEffect(() =>{
    if(source && !translation){
      translate(index)
    }
  },[source])

  

  return (
    <Tr h={10} className="table-row">
      <Td h={10} w={"50%"} onClick={onToggle}>
        <Editable
          id={index}
          defaultValue={source}
          suppressContentEditableWarning
        >
          <EditablePreview />
          <EditableInput />
        </Editable>

        <Collapse in={isOpen} animateOpacity>
          <Flex mt={"2%"} w={"100%"} alignItems={"center"}>
            <Button
              w={"20%"}
              colorScheme={"orange"}
              leftIcon={<RiTranslate2 />}
              size={"sm"}
              onClick={() => translate(index)}
              mt="2%"
            >
              {!translated ? "Translate" : "Retranslate"}
            </Button>
          </Flex>

          <Flex mt={"2%"} w={"50%"} alignItems={"center"}></Flex>
        </Collapse>
      </Td>
      <Td w={"50%"}>
        {loading && (
          <TailSpin
            height="15"
            width="15"
            color="#f3843f"
            ariaLabel="tail-spin-loading"
            radius="2"
            wrapperStyle={{}}
            wrapperClass="loader"
            visible
          />
        )}

        <Flex flexDirection={"column"}>
          <div
            suppressContentEditableWarning
            contentEditable
          >
            {translation}
          </div>
        </Flex>
      </Td>
    </Tr>
  );
}
