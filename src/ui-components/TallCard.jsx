import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Image, Text } from '@aws-amplify/ui-react';


export default function TallCard(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="8px"
    direction="column"
    width="320px"
    justifyContent="center"
    alignItems="flex-start"
    position="relative"
    backgroundColor="rgba(255,255,255,1)"
    {...getOverrideProps(overrides, "TallCard")}
    {...rest}
  >
    <Image
      height="400px"
      display="block"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      objectFit="cover"
      alt=""
      {...getOverrideProps(overrides, "image")}
    />
    <Flex
      gap="8px"
      direction="column"
      justifyContent="flex-start"
      alignItems="flex-start"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      padding="0px 8px 0px 8px"
      {...getOverrideProps(overrides, "Text Grouping")}
    >
      <Text
        fontFamily="Inter"
        fontSize="16px"
        fontWeight="400"
        color="rgba(13,26,38,1)"
        lineHeight="24px"
        textAlign="left"
        display="block"
        letterSpacing="0.01px"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "Classic Long Sleeve T-Shirt")}
      >
        Classic Long Sleeve T-Shirt
      </Text>
      <Text
        fontFamily="Inter"
        fontSize="14px"
        fontWeight="400"
        color="rgba(48,64,80,1)"
        lineHeight="24px"
        textAlign="left"
        display="block"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "$99")}
      >
        $99
      </Text>
    </Flex>
  </Flex>
  )
}
