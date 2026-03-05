import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, TextField, TextAreaField, CheckboxField, Button, Text } from '@aws-amplify/ui-react';
import MyIcon from './MyIcon';

export default function ContactUs(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="24px"
    direction="column"
    width="823px"
    justifyContent="flex-start"
    alignItems="flex-start"
    position="relative"
    borderRadius="8px"
    padding="32px 32px 32px 32px"
    backgroundColor="rgba(250,250,250,1)"
    {...getOverrideProps(overrides, "ContactUs")}
    {...rest}
  >
    <Flex
      gap="24px"
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      {...getOverrideProps(overrides, "Frame 428")}
    >
      <TextField
        label="First name"
        grow="1"
        shrink="1"
        basis="0"
        placeholder=""
        size="default"
        isDisabled={false}
        labelHidden={false}
        variation="default"
        {...getOverrideProps(overrides, "TextField29766936")}
      />
      <TextField
        label="Last name"
        grow="1"
        shrink="1"
        basis="0"
        placeholder=""
        size="default"
        isDisabled={false}
        labelHidden={false}
        variation="default"
        {...getOverrideProps(overrides, "TextField29766938")}
      />
    </Flex>
    <TextField
      label="Email address"
      shrink="0"
      alignSelf="stretch"
      placeholder=""
      size="default"
      isDisabled={false}
      labelHidden={false}
      variation="default"
      {...getOverrideProps(overrides, "TextField29766939")}
    />
    <TextAreaField
      label="Message"
      shrink="0"
      alignSelf="stretch"
      placeholder=""
      size="default"
      isDisabled={false}
      labelHidden={false}
      variation="default"
      {...getOverrideProps(overrides, "TextAreaField")}
    />
    <CheckboxField
      label="You agree to our Privacy Policy"
      shrink="0"
      size="default"
      defaultChecked={false}
      isDisabled={false}
      labelPosition="end"
      {...getOverrideProps(overrides, "CheckboxField")}
    />
    <Button
      shrink="0"
      alignSelf="stretch"
      size="large"
      isDisabled={false}
      variation="primary"
      {...getOverrideProps(overrides, "Button")}
    >
      Send message
    </Button>
    <Flex
      gap="24px"
      direction="row"
      justifyContent="center"
      alignItems="flex-start"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      {...getOverrideProps(overrides, "Frame 2829766941")}
    >
      <Flex
        gap="8px"
        direction="row"
        justifyContent="flex-start"
        alignItems="center"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Frame 2829766942")}
      >
        <MyIcon
          type="instagram"
          {...getOverrideProps(overrides, "MyIcon39193120")}
        />
        <Text
          fontFamily="Inter"
          fontSize="14px"
          fontWeight="400"
          color="rgba(92,102,112,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Instagram")}
        >
          Instagram
        </Text>
      </Flex>
      <Flex
        gap="8px"
        direction="row"
        justifyContent="flex-start"
        alignItems="center"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Frame 30")}
      >
        <MyIcon
          type="twitter"
          {...getOverrideProps(overrides, "MyIcon39193123")}
        />
        <Text
          fontFamily="Inter"
          fontSize="14px"
          fontWeight="400"
          color="rgba(92,102,112,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Twitter")}
        >
          Twitter
        </Text>
      </Flex>
    </Flex>
  </Flex>
  )
}
