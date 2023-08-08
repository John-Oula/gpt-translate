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
import React, { useState } from "react";
import { RiTranslate2 } from "react-icons/ri";
import { TailSpin } from "react-loader-spinner";

export default function TextBox({ source, index }) {
  const [translation, setTranslation] = useState("");
  const { isOpen, onToggle } = useDisclosure();
  const [translated, setTranslated] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const translate = async (id) => {
    const text = document.getElementById(id).innerText;
    setTranslation("");
    setTranslated(false);
    setLoading(true);

    const systemMsg = `You are a veteran translator.
    You will be provided with short sentences to translate.
    You have these requirements:
    1. Translate the short sentences into English.
    2. Use the glossary only if glossary terms are provided, for reference and ensure you replace any matching glossary terms in the sentences with matching translations. 
    3. Aside from the translation, do not provide any other output. 
    4. Do not use quotes, unless if they are part of the provided text.`;

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
      setTranslation((prev) => prev + chunkValue)
        
    }

    setLoading(false);
    setTranslated(true);
  };
  return (
    <Tr className="table-row">
      <Td w={"50%"} onClick={onToggle}>
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

          <Flex mt={"2%"} w={"100%"} alignItems={"center"}></Flex>
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
