import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text, TextField, SelectField, PhoneNumberField, Button, Image } from '@aws-amplify/ui-react';


export default function FormCheckout(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="48px"
    direction="row"
    width="1160px"
    justifyContent="flex-start"
    alignItems="flex-start"
    position="relative"
    {...getOverrideProps(overrides, "FormCheckout")}
    {...rest}
  >
    <Flex
      gap="48px"
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      grow="1"
      shrink="1"
      basis="0"
      position="relative"
      padding="32px 0px 32px 0px"
      backgroundColor="rgba(255,255,255,1)"
      {...getOverrideProps(overrides, "Frame 41129767005")}
    >
      <Flex
        gap="32px"
        direction="column"
        justifyContent="center"
        alignItems="center"
        grow="1"
        shrink="1"
        basis="0"
        position="relative"
        {...getOverrideProps(overrides, "Frame 313")}
      >
        <Flex
          gap="24px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          padding="0px 32px 0px 32px"
          {...getOverrideProps(overrides, "Frame 406")}
        >
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="600"
            color="rgba(13,26,38,1)"
            lineHeight="20px"
            textAlign="left"
            display="block"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Shipping information")}
          >
            Shipping information
          </Text>
          <Flex
            gap="24px"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            alignSelf="stretch"
            position="relative"
            {...getOverrideProps(overrides, "Frame 426")}
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
              {...getOverrideProps(overrides, "TextField29767009")}
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
              {...getOverrideProps(overrides, "TextField29767010")}
            />
          </Flex>
        </Flex>
        <Flex
          gap="24px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          padding="0px 32px 0px 32px"
          {...getOverrideProps(overrides, "Frame 409")}
        >
          <TextField
            label="Street address"
            shrink="0"
            alignSelf="stretch"
            placeholder=""
            size="default"
            isDisabled={false}
            labelHidden={false}
            variation="default"
            {...getOverrideProps(overrides, "TextField29767014")}
          />
          <Flex
            gap="24px"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            alignSelf="stretch"
            position="relative"
            {...getOverrideProps(overrides, "Frame 425")}
          >
            <TextField
              label="City"
              grow="1"
              shrink="1"
              basis="0"
              placeholder=""
              size="default"
              isDisabled={false}
              labelHidden={false}
              variation="default"
              {...getOverrideProps(overrides, "TextField29767015")}
            />
            <TextField
              label="Zip code"
              grow="1"
              shrink="1"
              basis="0"
              placeholder=""
              size="default"
              isDisabled={false}
              labelHidden={false}
              variation="default"
              {...getOverrideProps(overrides, "TextField39343126")}
            />
            <SelectField
              width="100px"
              label="State"
              shrink="0"
              placeholder=""
              size="default"
              isDisabled={false}
              labelHidden={false}
              variation="default"
              {...getOverrideProps(overrides, "SelectField")}
            />
          </Flex>
        </Flex>
        <Flex
          gap="24px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          padding="0px 32px 0px 32px"
          {...getOverrideProps(overrides, "Frame 410")}
        >
          <TextField
            label="Email address"
            shrink="0"
            alignSelf="stretch"
            placeholder=""
            size="default"
            isDisabled={false}
            labelHidden={false}
            variation="default"
            {...getOverrideProps(overrides, "TextField39343134")}
          />
          <PhoneNumberField
            label="Phone number"
            shrink="0"
            alignSelf="stretch"
            placeholder=""
            size="default"
            isDisabled={false}
            labelHidden={false}
            variation="default"
            {...getOverrideProps(overrides, "PhoneNumberField")}
          />
        </Flex>
        <Flex
          gap="24px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          padding="0px 32px 0px 32px"
          {...getOverrideProps(overrides, "Frame 41139343187")}
        >
          <Button
            shrink="0"
            alignSelf="stretch"
            size="large"
            isDisabled={false}
            variation="primary"
            {...getOverrideProps(overrides, "Button")}
          >
            Continue to payment
          </Button>
        </Flex>
      </Flex>
      <Image
        display="block"
        grow="1"
        shrink="1"
        basis="0"
        alignSelf="stretch"
        position="relative"
        objectFit="cover"
        alt=""
        {...getOverrideProps(overrides, "image")}
      />
    </Flex>
  </Flex>
  )
}
