import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text } from "@aws-amplify/ui-react";

export default function TodoListItem(props) {
  const { overrides: overridesProp, ...rest } = props;

  // variants を使っていない場合でも、Amplify Studio形式に合わせておく
  const variants = [];
  const overrides = mergeVariantsAndOverrides(
    getOverridesFromVariants(variants, props),
    overridesProp || {}
  );

  // ✅ overrides で children を差し替え可能にする（children を分離して JSX の中身に入れる）
  const { children: todoChildren, ...todoTextProps } = getOverrideProps(
    overrides,
    "Todo content"
  );
  const { children: dueChildren, ...dueTextProps } = getOverrideProps(
    overrides,
    "Due"
  );

  return (
    <Flex
      gap="10px"
      direction="row"
      width="420px"
      justifyContent="flex-start"
      alignItems="flex-start"
      overflow="hidden"
      position="relative"
      padding="12px 16px"
      backgroundColor="rgba(202,232,198,1)"
      borderRadius="8px"
      {...getOverrideProps(overrides, "TodoListItem")}
      {...rest}
    >
      <Flex
        gap="6px"
        direction="column"
        grow="1"
        shrink="1"
        basis="0"
        alignItems="flex-start"
        position="relative"
        {...getOverrideProps(overrides, "Frame 3")}
      >
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="600"
          lineHeight="20px"
          textAlign="left"
          display="block"
          width="100%"
          position="relative"
          whiteSpace="pre-wrap"
          {...todoTextProps} // ← overridesでfontSize等も上書き可
        >
          {todoChildren ?? "Todo content"}
        </Text>

        <Text
          fontFamily="Inter"
          fontSize="12px"
          fontWeight="400"
          lineHeight="16px"
          textAlign="left"
          display="block"
          width="100%"
          position="relative"
          whiteSpace="pre-wrap"
          {...dueTextProps} // ← overridesでchildren/スタイル上書き可
        >
          {dueChildren ?? "Due"}
        </Text>
      </Flex>
    </Flex>
  );
}
