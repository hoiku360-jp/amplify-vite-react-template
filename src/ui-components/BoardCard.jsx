import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text } from "@aws-amplify/ui-react";

export default function BoardCard(props) {
  const { overrides, ...rest } = props;

  // ★ 追加：Textごとのoverrideを変数で受ける（childrenを反映するため）
  const titleProps = getOverrideProps(overrides, "Board title");
  const descProps = getOverrideProps(overrides, "Board description");
  const updatedProps = getOverrideProps(overrides, "Updated at");

  return (
    <Flex
      gap="2px"
      direction="column"
      justifyContent="flex-start"
      alignItems="flex-start"
      position="relative"
      borderRadius="12px"
      padding="23px 26px 23px 26px"
      backgroundImage="linear-gradient(-90deg, rgba(255,255,255,1), rgba(153,153,153,1))"
      {...getOverrideProps(overrides, "BoardCard")}
      {...rest}
    >
      <Text
        fontFamily="Inter"
        fontSize="32px"
        fontWeight="600"
        color="rgba(0,0,0,1)"
        lineHeight="48px"
        textAlign="left"
        display="block"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...titleProps}
      >
        {titleProps?.children ?? "Board title"}
      </Text>

      <Text
        fontFamily="Inter"
        fontSize="32px"
        fontWeight="600"
        color="rgba(0,0,0,1)"
        lineHeight="48px"
        textAlign="left"
        display="block"
        width="275px"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...descProps}
      >
        {descProps?.children ?? "Board description"}
      </Text>

      <Text
        fontFamily="Inter"
        fontSize="32px"
        fontWeight="600"
        color="rgba(0,0,0,1)"
        lineHeight="48px"
        textAlign="left"
        display="block"
        width="172px"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...updatedProps}
      >
        {updatedProps?.children ?? "Updated at"}
      </Text>
    </Flex>
  );
}
