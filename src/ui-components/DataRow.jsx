import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text, Button } from '@aws-amplify/ui-react';


export default function DataRow(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="16px"
    direction="row"
    width="991px"
    justifyContent="center"
    alignItems="center"
    position="relative"
    padding="16px 0px 16px 0px"
    {...getOverrideProps(overrides, "DataRow")}
    {...rest}
  >
    <Text
      fontFamily="Inter"
      fontSize="16px"
      fontWeight="600"
      color="rgba(13,26,38,1)"
      lineHeight="24px"
      textAlign="left"
      display="block"
      width="300px"
      shrink="0"
      position="relative"
      whiteSpace="pre-wrap"
      {...getOverrideProps(overrides, "label")}
    >
      Label
    </Text>
    <Text
      fontFamily="Inter"
      fontSize="16px"
      fontWeight="400"
      color="rgba(48,64,80,1)"
      lineHeight="24px"
      textAlign="left"
      display="block"
      grow="1"
      shrink="1"
      basis="0"
      position="relative"
      whiteSpace="pre-wrap"
      {...getOverrideProps(overrides, "value")}
    >
      Value
    </Text>
    <Button
      shrink="0"
      size="small"
      isDisabled={false}
      variation="link"
      {...getOverrideProps(overrides, "Button")}
    >
      Edit
    </Button>
  </Flex>
  )
}
