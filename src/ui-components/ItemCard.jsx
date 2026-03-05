import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Badge, Text } from '@aws-amplify/ui-react';


export default function ItemCard(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="16px"
    direction="column"
    width="320px"
    justifyContent="flex-start"
    alignItems="flex-start"
    position="relative"
    padding="16px 16px 16px 16px"
    backgroundColor="rgba(255,255,255,1)"
    {...getOverrideProps(overrides, "ItemCard")}
    {...rest}
  >
    <Badge
      gap="0"
      shrink="0"
      size="small"
      variation="success"
      {...getOverrideProps(overrides, "Badge")}
    >
      New!
    </Badge>
    <Flex
      gap="0"
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      {...getOverrideProps(overrides, "Frame 417")}
    >
      <Flex
        gap="0"
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Product Title")}
      >
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="700"
          color="rgba(13,26,38,1)"
          lineHeight="20px"
          textAlign="left"
          display="block"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "T-Shirt")}
        >
          T-Shirt
        </Text>
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="400"
          color="rgba(48,64,80,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          letterSpacing="0.01px"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Classic Long Sleeve")}
        >
          Classic Long Sleeve
        </Text>
      </Flex>
      <Text
        fontFamily="Inter"
        fontSize="16px"
        fontWeight="800"
        color="rgba(13,26,38,1)"
        lineHeight="20px"
        textAlign="right"
        display="block"
        shrink="0"
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
