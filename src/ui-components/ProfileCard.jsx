import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Image, Text, Button } from '@aws-amplify/ui-react';
import MyIcon from './MyIcon';

export default function ProfileCard(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="24px"
    direction="column"
    width="320px"
    justifyContent="flex-start"
    alignItems="center"
    position="relative"
    padding="24px 24px 24px 24px"
    backgroundColor="rgba(255,255,255,1)"
    {...getOverrideProps(overrides, "ProfileCard")}
    {...rest}
  >
    <Image
      width="160px"
      height="160px"
      display="block"
      shrink="0"
      position="relative"
      borderRadius="160px"
      objectFit="cover"
      alt=""
      {...getOverrideProps(overrides, "image")}
    />
    <Flex
      gap="8px"
      direction="column"
      justifyContent="flex-start"
      alignItems="center"
      shrink="0"
      position="relative"
      {...getOverrideProps(overrides, "Name")}
    >
      <Text
        fontFamily="Inter"
        fontSize="20px"
        fontWeight="700"
        color="rgba(13,26,38,1)"
        lineHeight="25px"
        textAlign="center"
        display="block"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "Melinda Marcus")}
      >
        Melinda Marcus
      </Text>
      <Text
        fontFamily="Inter"
        fontSize="16px"
        fontWeight="400"
        color="rgba(48,64,80,1)"
        lineHeight="24px"
        textAlign="center"
        display="block"
        letterSpacing="0.01px"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "Design Engineer at Cloth Studios")}
      >
        Design Engineer at Cloth Studios
      </Text>
    </Flex>
    <Flex
      gap="16px"
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      shrink="0"
      position="relative"
      {...getOverrideProps(overrides, "Followers")}
    >
      <MyIcon
        type="group"
        {...getOverrideProps(overrides, "MyIcon")}
      />
      <Text
        fontFamily="Inter"
        fontSize="16px"
        fontWeight="400"
        color="rgba(48,64,80,1)"
        lineHeight="24px"
        textAlign="center"
        display="block"
        letterSpacing="0.01px"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "99 Followers")}
      >
        99 Followers
      </Text>
    </Flex>
    <Button
      shrink="0"
      alignSelf="stretch"
      size="large"
      isDisabled={false}
      variation="primary"
      {...getOverrideProps(overrides, "Button")}
    >
      View Profile
    </Button>
  </Flex>
  )
}
