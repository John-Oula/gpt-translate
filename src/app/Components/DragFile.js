import { Box, Center, Text } from "@chakra-ui/react";
import React from "react";
import { FiFilePlus } from "react-icons/fi";

export default function DragFile() {
  return (
    <Center flexDirection={"flex-column"} w={"100%"} h={"100vh"}>
      <Box align={"center"}>
        <FiFilePlus size={100} />
        <Text mt={"10%"}>
          Drag and drop a <strong>.png or .jpg</strong> image file{" "}
        </Text>

      </Box>
    </Center>
  );
}
