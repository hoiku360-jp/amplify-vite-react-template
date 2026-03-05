import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, SelectField, Button } from '@aws-amplify/ui-react';


export default function Filters(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="16px"
    direction="row"
    justifyContent="center"
    alignItems="flex-end"
    overflow="hidden"
    position="relative"
    padding="16px 16px 16px 16px"
    {...getOverrideProps(overrides, "Filters")}
    {...rest}
  >
    <SelectField
      width="240px"
      label="Status"
      placeholder="All"
      shrink="0"
      size="small"
      isDisabled={false}
      labelHidden={false}
      variation="default"
      {...getOverrideProps(overrides, "SelectField38963527")}
    />
    <SelectField
      width="240px"
      label="Channel"
      placeholder="All"
      shrink="0"
      size="small"
      isDisabled={false}
      labelHidden={false}
      variation="default"
      {...getOverrideProps(overrides, "SelectField38963544")}
    />
    <Button
      shrink="0"
      size="small"
      isDisabled={false}
      variation="default"
      {...getOverrideProps(overrides, "Button")}
    >
      Clear
    </Button>
  </Flex>
  )
}
