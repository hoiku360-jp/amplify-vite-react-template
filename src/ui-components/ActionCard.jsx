import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Image, Text, Rating, Button } from '@aws-amplify/ui-react';


export default function ActionCard(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="0"
    direction="column"
    width="320px"
    justifyContent="center"
    alignItems="flex-start"
    position="relative"
    backgroundColor="rgba(255,255,255,1)"
    {...getOverrideProps(overrides, "ActionCard")}
    {...rest}
  >
    <Image
      height="408px"
      display="block"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      objectFit="cover"
      alt=""
      {...getOverrideProps(overrides, "image")}
    />
    <Flex
      gap="16px"
      direction="column"
      justifyContent="flex-start"
      alignItems="flex-start"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      padding="16px 16px 16px 16px"
      {...getOverrideProps(overrides, "Card Area")}
    >
      <Flex
        gap="8px"
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        {...getOverrideProps(overrides, "Main Text")}
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
          alignSelf="stretch"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Classic Long Sleeve T-Shirt")}
        >
          Classic Long Sleeve T-Shirt
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
          alignSelf="stretch"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Information about this product")}
        >
          Information about this product
        </Text>
      </Flex>
      <Rating
        width="174px"
        shrink="0"
        size="default"
        {...getOverrideProps(overrides, "Rating")}
      />
      <Text
        fontFamily="Inter"
        fontSize="20px"
        fontWeight="700"
        color="rgba(13,26,38,1)"
        lineHeight="25px"
        textAlign="left"
        display="block"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "$99 USD")}
      >
        $99 USD
      </Text>
      <Button
        shrink="0"
        alignSelf="stretch"
        size="large"
        isDisabled={false}
        variation="primary"
        {...getOverrideProps(overrides, "Button")}
      >
        Button
      </Button>
    </Flex>
  </Flex>
  )
}
