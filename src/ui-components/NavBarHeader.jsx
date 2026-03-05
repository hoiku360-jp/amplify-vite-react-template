import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text, Image } from '@aws-amplify/ui-react';
import LogoWithText from './LogoWithText';
import MyIcon from './MyIcon';

export default function NavBarHeader(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="40px"
    direction="row"
    width="1440px"
    justifyContent="center"
    alignItems="center"
    position="relative"
    boxShadow="0px 2px 6px rgba(0.05098039284348488, 0.10196078568696976, 0.14901961386203766, 0.15000000596046448)"
    padding="24px 32px 24px 32px"
    backgroundColor="rgba(255,255,255,1)"
    {...getOverrideProps(overrides, "NavBarHeader")}
    {...rest}
  >
    <LogoWithText
      color="brand"
      {...getOverrideProps(overrides, "LogoWithText")}
    />
    <Flex
      gap="40px"
      direction="row"
      justifyContent="flex-start"
      alignItems="center"
      grow="1"
      shrink="1"
      basis="0"
      position="relative"
      {...getOverrideProps(overrides, "Frame 32129767076")}
    >
      <Text
        fontFamily="Inter"
        fontSize="16px"
        fontWeight="400"
        color="rgba(92,102,112,1)"
        lineHeight="24px"
        textAlign="left"
        display="block"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "Dashboard")}
      >
        Dashboard
      </Text>
      <Text
        fontFamily="Inter"
        fontSize="16px"
        fontWeight="400"
        color="rgba(92,102,112,1)"
        lineHeight="24px"
        textAlign="left"
        display="block"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "Jobs")}
      >
        Jobs
      </Text>
      <Text
        fontFamily="Inter"
        fontSize="16px"
        fontWeight="400"
        color="rgba(92,102,112,1)"
        lineHeight="24px"
        textAlign="left"
        display="block"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "Applicants")}
      >
        Applicants
      </Text>
      <Text
        fontFamily="Inter"
        fontSize="16px"
        fontWeight="400"
        color="rgba(92,102,112,1)"
        lineHeight="24px"
        textAlign="left"
        display="block"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "Company")}
      >
        Company
      </Text>
    </Flex>
    <Flex
      gap="32px"
      direction="row"
      justifyContent="flex-end"
      alignItems="center"
      grow="1"
      shrink="1"
      basis="0"
      position="relative"
      {...getOverrideProps(overrides, "Frame 32129767081")}
    >
      <MyIcon
        type="notification"
        {...getOverrideProps(overrides, "MyIcon")}
      />
      <Image
        width="45px"
        height="45px"
        display="block"
        shrink="0"
        position="relative"
        borderRadius="160px"
        objectFit="cover"
        alt=""
        {...getOverrideProps(overrides, "image")}
      />
    </Flex>
  </Flex>
  )
}
