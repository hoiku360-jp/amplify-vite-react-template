import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text } from '@aws-amplify/ui-react';
import MyIcon from './MyIcon';

export default function Features2x2(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="0"
    direction="column"
    width="1440px"
    justifyContent="center"
    alignItems="center"
    position="relative"
    padding="40px 160px 40px 160px"
    backgroundColor="rgba(250,250,250,1)"
    {...getOverrideProps(overrides, "Features2x2")}
    {...rest}
  >
    <Flex
      gap="24px"
      direction="column"
      justifyContent="flex-start"
      alignItems="flex-start"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      {...getOverrideProps(overrides, "Frame 13629766592")}
    >
      <Flex
        gap="24px"
        direction="row"
        justifyContent="center"
        alignItems="center"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        {...getOverrideProps(overrides, "Frame 13629766593")}
      >
        <Flex
          gap="16px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          grow="1"
          shrink="1"
          basis="0"
          alignSelf="stretch"
          position="relative"
          boxShadow="0px 2px 6px rgba(0.05098039284348488, 0.10196078568696976, 0.14901961386203766, 0.15000000596046448)"
          padding="40px 40px 40px 40px"
          backgroundColor="rgba(255,255,255,1)"
          {...getOverrideProps(overrides, "Frame 37429766594")}
        >
          <Flex
            gap="0"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            position="relative"
            borderRadius="8px"
            padding="8px 8px 8px 8px"
            backgroundColor="rgba(233,249,252,1)"
            {...getOverrideProps(overrides, "Frame 43039424113")}
          >
            <MyIcon
              type="checkmark"
              {...getOverrideProps(overrides, "MyIcon39424114")}
            />
          </Flex>
          <Text
            fontFamily="Inter"
            fontSize="24px"
            fontWeight="600"
            color="rgba(13,26,38,1)"
            lineHeight="30px"
            textAlign="left"
            display="block"
            shrink="0"
            alignSelf="stretch"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Feature A")}
          >
            Feature A
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
            {...getOverrideProps(overrides, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.29766596")}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
          </Text>
        </Flex>
        <Flex
          gap="16px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          grow="1"
          shrink="1"
          basis="0"
          alignSelf="stretch"
          position="relative"
          boxShadow="0px 2px 6px rgba(0.05098039284348488, 0.10196078568696976, 0.14901961386203766, 0.15000000596046448)"
          padding="40px 40px 40px 40px"
          backgroundColor="rgba(255,255,255,1)"
          {...getOverrideProps(overrides, "Frame 37329766597")}
        >
          <Flex
            gap="0"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            position="relative"
            borderRadius="8px"
            padding="8px 8px 8px 8px"
            backgroundColor="rgba(233,249,252,1)"
            {...getOverrideProps(overrides, "Frame 43039424116")}
          >
            <MyIcon
              type="checkmark"
              {...getOverrideProps(overrides, "MyIcon39424117")}
            />
          </Flex>
          <Text
            fontFamily="Inter"
            fontSize="24px"
            fontWeight="600"
            color="rgba(13,26,38,1)"
            lineHeight="30px"
            textAlign="left"
            display="block"
            shrink="0"
            alignSelf="stretch"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Feature B")}
          >
            Feature B
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
            {...getOverrideProps(overrides, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.29766599")}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
          </Text>
        </Flex>
      </Flex>
      <Flex
        gap="24px"
        direction="row"
        justifyContent="center"
        alignItems="center"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        {...getOverrideProps(overrides, "Frame 393")}
      >
        <Flex
          gap="16px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          grow="1"
          shrink="1"
          basis="0"
          alignSelf="stretch"
          position="relative"
          boxShadow="0px 2px 6px rgba(0.05098039284348488, 0.10196078568696976, 0.14901961386203766, 0.15000000596046448)"
          borderRadius="8px"
          padding="40px 40px 40px 40px"
          backgroundColor="rgba(255,255,255,1)"
          {...getOverrideProps(overrides, "Frame 37429766601")}
        >
          <Flex
            gap="0"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            position="relative"
            borderRadius="8px"
            padding="8px 8px 8px 8px"
            backgroundColor="rgba(233,249,252,1)"
            {...getOverrideProps(overrides, "Frame 43039403233")}
          >
            <MyIcon
              type="checkmark"
              {...getOverrideProps(overrides, "MyIcon39403234")}
            />
          </Flex>
          <Text
            fontFamily="Inter"
            fontSize="24px"
            fontWeight="600"
            color="rgba(13,26,38,1)"
            lineHeight="30px"
            textAlign="left"
            display="block"
            shrink="0"
            alignSelf="stretch"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Feature C")}
          >
            Feature C
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
            {...getOverrideProps(overrides, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.29766603")}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
          </Text>
        </Flex>
        <Flex
          gap="16px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          grow="1"
          shrink="1"
          basis="0"
          alignSelf="stretch"
          position="relative"
          boxShadow="0px 2px 6px rgba(0.05098039284348488, 0.10196078568696976, 0.14901961386203766, 0.15000000596046448)"
          padding="40px 40px 40px 40px"
          backgroundColor="rgba(255,255,255,1)"
          {...getOverrideProps(overrides, "Frame 37329766604")}
        >
          <Flex
            gap="0"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            position="relative"
            borderRadius="8px"
            padding="8px 8px 8px 8px"
            backgroundColor="rgba(233,249,252,1)"
            {...getOverrideProps(overrides, "Frame 43039424110")}
          >
            <MyIcon
              type="checkmark"
              {...getOverrideProps(overrides, "MyIcon39424111")}
            />
          </Flex>
          <Text
            fontFamily="Inter"
            fontSize="24px"
            fontWeight="600"
            color="rgba(13,26,38,1)"
            lineHeight="30px"
            textAlign="left"
            display="block"
            shrink="0"
            alignSelf="stretch"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Feature D")}
          >
            Feature D
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
            {...getOverrideProps(overrides, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.29766606")}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
          </Text>
        </Flex>
      </Flex>
    </Flex>
  </Flex>
  )
}
