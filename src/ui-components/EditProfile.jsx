import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text, Image, TextField, Button } from '@aws-amplify/ui-react';
import MyIcon from './MyIcon';

export default function EditProfile(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="16px"
    direction="column"
    width="640px"
    justifyContent="flex-start"
    alignItems="flex-start"
    position="relative"
    backgroundColor="rgba(255,255,255,1)"
    {...getOverrideProps(overrides, "EditProfile")}
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
      padding="24px 24px 24px 24px"
      {...getOverrideProps(overrides, "Content")}
    >
      <Flex
        gap="16px"
        direction="row"
        justifyContent="flex-start"
        alignItems="center"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        {...getOverrideProps(overrides, "Edit Profile29766913")}
      >
        <MyIcon
          type="close"
          {...getOverrideProps(overrides, "MyIcon")}
        />
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
          {...getOverrideProps(overrides, "Edit Profile29766916")}
        >
          Edit Profile
        </Text>
      </Flex>
      <Flex
        gap="16px"
        direction="row"
        justifyContent="flex-start"
        alignItems="center"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        {...getOverrideProps(overrides, "Profile")}
      >
        <Image
          width="96px"
          height="96px"
          display="block"
          shrink="0"
          position="relative"
          borderRadius="160px"
          objectFit="cover"
          alt=""
          {...getOverrideProps(overrides, "image")}
        />
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="400"
          color="rgba(13,26,38,1)"
          lineHeight="22px"
          textAlign="left"
          display="block"
          textDecoration="underline"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Upload New Image")}
        >
          Upload New Image
        </Text>
      </Flex>
      <Flex
        gap="16px"
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        {...getOverrideProps(overrides, "Forms")}
      >
        <TextField
          label="Full name"
          placeholder="John Doe"
          shrink="0"
          alignSelf="stretch"
          size="default"
          isDisabled={false}
          labelHidden={false}
          variation="default"
          {...getOverrideProps(overrides, "TextField29766922")}
        />
        <TextField
          label="Location"
          placeholder="Seattle, WA"
          shrink="0"
          alignSelf="stretch"
          size="default"
          isDisabled={false}
          labelHidden={false}
          variation="default"
          {...getOverrideProps(overrides, "TextField29766923")}
        />
        <TextField
          label="Email"
          placeholder="john.doe@awsamplify.com"
          shrink="0"
          alignSelf="stretch"
          size="default"
          isDisabled={false}
          labelHidden={false}
          variation="default"
          {...getOverrideProps(overrides, "TextField29766924")}
        />
      </Flex>
      <Button
        shrink="0"
        size="default"
        isDisabled={false}
        variation="primary"
        {...getOverrideProps(overrides, "Button")}
      >
        Save
      </Button>
    </Flex>
  </Flex>
  )
}
