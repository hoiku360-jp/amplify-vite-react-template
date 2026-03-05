import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Image, Text } from '@aws-amplify/ui-react';


export default function StandardCard(props) {
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
    {...getOverrideProps(overrides, "StandardCard")}
    {...rest}
  >
    <Image
      height="160px"
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
        {...getOverrideProps(overrides, "Text Group")}
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
          {...getOverrideProps(overrides, "$99 USD")}
        >
          $99 USD
        </Text>
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
          {...getOverrideProps(overrides, "4bds 3 ba 2,530 sqft - Active")}
        >
          4bds 3 ba 2,530 sqft - Active
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
          {...getOverrideProps(overrides, "832 34th Ave, Seattle, WA 98122")}
        >
          832 34th Ave, Seattle, WA 98122
        </Text>
      </Flex>
    </Flex>
  </Flex>
  )
}
