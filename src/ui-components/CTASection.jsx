import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text, TextField, Button } from '@aws-amplify/ui-react';


export default function CTASection(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="10px"
    direction="column"
    width="1440px"
    justifyContent="center"
    alignItems="flex-start"
    overflow="hidden"
    position="relative"
    padding="160px 160px 160px 160px"
    backgroundColor="rgba(255,255,255,1)"
    {...getOverrideProps(overrides, "CTASection")}
    {...rest}
  >
    <Flex
      gap="24px"
      direction="column"
      justifyContent="center"
      alignItems="flex-start"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      {...getOverrideProps(overrides, "Type Lock Up")}
    >
      <Flex
        gap="12px"
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Frame 436")}
      >
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="700"
          color="rgba(191,64,191,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          width="1120px"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Newsletter")}
        >
          Newsletter
        </Text>
        <Text
          fontFamily="Inter"
          fontSize="24px"
          fontWeight="600"
          color="rgba(13,26,38,1)"
          lineHeight="30px"
          textAlign="left"
          display="block"
          width="1120px"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Stay in touch and never miss an update")}
        >
          Stay in touch and never miss an update
        </Text>
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="400"
          color="rgba(48,64,80,1)"
          lineHeight="20px"
          textAlign="left"
          display="block"
          width="1120px"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Keep up to date on the latest and greatest in the frontend and fullstack community")}
        >
          Keep up to date on the latest and greatest in the frontend and fullstack community
        </Text>
      </Flex>
      <Flex
        gap="8px"
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Form")}
      >
        <TextField
          width="300px"
          placeholder="Email address"
          shrink="0"
          size="default"
          isDisabled={false}
          labelHidden={true}
          variation="default"
          {...getOverrideProps(overrides, "TextField")}
        />
        <Button
          shrink="0"
          size="default"
          isDisabled={false}
          variation="primary"
          {...getOverrideProps(overrides, "Button")}
        >
          Sign me up
        </Button>
      </Flex>
    </Flex>
  </Flex>
  )
}
