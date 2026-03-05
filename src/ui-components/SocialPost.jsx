import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text, Image } from '@aws-amplify/ui-react';
import MyIcon from './MyIcon';

export default function SocialPost(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="16px"
    direction="column"
    width="960px"
    justifyContent="flex-start"
    alignItems="flex-start"
    position="relative"
    padding="24px 24px 24px 24px"
    backgroundColor="rgba(255,255,255,1)"
    {...getOverrideProps(overrides, "SocialPost")}
    {...rest}
  >
    <Flex
      gap="40px"
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      {...getOverrideProps(overrides, "Body")}
    >
      <Flex
        gap="16px"
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        grow="1"
        shrink="1"
        basis="0"
        position="relative"
        {...getOverrideProps(overrides, "Text")}
      >
        <Flex
          gap="16px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Headline")}
        >
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
            {...getOverrideProps(overrides, "New Amplify Studio gives designers the ability to export UI to React code")}
          >
            New Amplify Studio gives designers the ability to export UI to React code
          </Text>
          <Flex
            gap="16px"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            alignSelf="stretch"
            position="relative"
            {...getOverrideProps(overrides, "Frame")}
          >
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="400"
              color="rgba(92,102,112,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "Nikhil S")}
            >
              Nikhil S
            </Text>
            <Text
              fontFamily="Inter"
              fontSize="16px"
              fontWeight="400"
              color="rgba(92,102,112,1)"
              lineHeight="24px"
              textAlign="left"
              display="block"
              letterSpacing="0.01px"
              shrink="0"
              position="relative"
              whiteSpace="pre-wrap"
              {...getOverrideProps(overrides, "2nd December 2021")}
            >
              2nd December 2021
            </Text>
          </Flex>
        </Flex>
        <Flex
          gap="16px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Article")}
        >
          <MyIcon
            type="arrow-right"
            {...getOverrideProps(overrides, "MyIcon29766860")}
          />
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(13,26,38,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            grow="1"
            shrink="1"
            basis="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "AWS Amplify Studio is a visual development environment for building full-stack web and mobile apps that grows with your business. Studio builds on existing backend building capabilities in AWS Amplify, allowing you to build your UI faster with a set of ready-to-use UI components that are editable in Figma. With Studio, you can quickly build an entire web app, front-to-back, with minimal coding, while still maintaining full control over your app design and behavior through code. Ship faster, scale effortlessly, and delight every user.")}
          >
            AWS Amplify Studio is a visual development environment for building full-stack web and mobile apps that grows with your business. Studio builds on existing backend building capabilities in AWS Amplify, allowing you to build your UI faster with a set of ready-to-use UI components that are editable in Figma. With Studio, you can quickly build an entire web app, front-to-back, with minimal coding, while still maintaining full control over your app design and behavior through code. Ship faster, scale effortlessly, and delight every user.
          </Text>
        </Flex>
        <Flex
          gap="16px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Share29766862")}
        >
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(92,102,112,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            letterSpacing="0.01px"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Share29766863")}
          >
            Share
          </Text>
          <MyIcon
            type="bookmark_border"
            {...getOverrideProps(overrides, "MyIcon29766864")}
          />
          <MyIcon
            type="share"
            {...getOverrideProps(overrides, "MyIcon29766865")}
          />
          <MyIcon
            type="more_vert"
            {...getOverrideProps(overrides, "MyIcon29766866")}
          />
        </Flex>
      </Flex>
      <Image
        width="160px"
        height="160px"
        display="block"
        shrink="0"
        position="relative"
        borderRadius="16px"
        alt=""
        {...getOverrideProps(overrides, "image")}
      />
    </Flex>
    <Flex
      gap="16px"
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      {...getOverrideProps(overrides, "Read more29766868")}
    >
      <MyIcon
        type="arrow-right"
        {...getOverrideProps(overrides, "MyIcon29766869")}
      />
      <Text
        fontFamily="Inter"
        fontSize="16px"
        fontWeight="400"
        color="rgba(13,26,38,1)"
        lineHeight="24px"
        textAlign="left"
        display="block"
        textDecoration="underline"
        letterSpacing="0.01px"
        grow="1"
        shrink="1"
        basis="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "Read more29766870")}
      >
        Read more
      </Text>
    </Flex>
  </Flex>
  )
}
