import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text, Badge } from '@aws-amplify/ui-react';


export default function Stat(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="16px"
    direction="column"
    justifyContent="flex-start"
    alignItems="flex-start"
    overflow="hidden"
    position="relative"
    padding="32px 32px 32px 32px"
    backgroundColor="rgba(255,255,255,1)"
    {...getOverrideProps(overrides, "Stat")}
    {...rest}
  >
    <Text
      fontFamily="Inter"
      fontSize="16px"
      fontWeight="400"
      color="rgba(92,102,112,1)"
      lineHeight="19.363636016845703px"
      textAlign="center"
      display="block"
      shrink="0"
      position="relative"
      whiteSpace="pre-wrap"
      {...getOverrideProps(overrides, "Sales")}
    >
      Sales
    </Text>
    <Flex
      gap="10px"
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      shrink="0"
      position="relative"
      {...getOverrideProps(overrides, "Frame 424")}
    >
      <Text
        fontFamily="Inter"
        fontSize="24px"
        fontWeight="400"
        color="rgba(13,26,38,1)"
        lineHeight="29.045454025268555px"
        textAlign="center"
        display="block"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "8,260")}
      >
        8,260
      </Text>
      <Badge
        shrink="0"
        size="default"
        variation="success"
        {...getOverrideProps(overrides, "Badge")}
      >
        +17%
      </Badge>
    </Flex>
  </Flex>
  )
}
