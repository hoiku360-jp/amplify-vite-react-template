import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text, TextField, Button, Image, Divider } from '@aws-amplify/ui-react';


export default function CheckoutPayment(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="48px"
    direction="row"
    width="1160px"
    justifyContent="flex-start"
    alignItems="flex-start"
    position="relative"
    {...getOverrideProps(overrides, "CheckoutPayment")}
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
      {...getOverrideProps(overrides, "Frame 41139343305")}
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
            fontSize="20px"
            fontWeight="600"
            color="rgba(13,26,38,1)"
            lineHeight="30px"
            textAlign="left"
            display="block"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Payment information")}
          >
            Payment information
          </Text>
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
            label="Credit card number"
            shrink="0"
            alignSelf="stretch"
            placeholder=""
            size="default"
            isDisabled={false}
            labelHidden={false}
            variation="default"
            {...getOverrideProps(overrides, "TextField39343313")}
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
              label="Expiration"
              grow="1"
              shrink="1"
              basis="0"
              placeholder=""
              size="default"
              isDisabled={false}
              labelHidden={false}
              variation="default"
              {...getOverrideProps(overrides, "TextField39343315")}
            />
            <TextField
              label="CVC"
              grow="1"
              shrink="1"
              basis="0"
              placeholder=""
              size="default"
              isDisabled={false}
              labelHidden={false}
              variation="default"
              {...getOverrideProps(overrides, "TextField39343316")}
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
            label="Discount code"
            shrink="0"
            alignSelf="stretch"
            placeholder=""
            size="default"
            isDisabled={false}
            labelHidden={false}
            variation="default"
            {...getOverrideProps(overrides, "TextField39343319")}
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
          {...getOverrideProps(overrides, "Frame 41139343321")}
        >
          <Button
            shrink="0"
            alignSelf="stretch"
            size="large"
            isDisabled={false}
            variation="primary"
            {...getOverrideProps(overrides, "Button")}
          >
            Purchase
          </Button>
        </Flex>
      </Flex>
      <Flex
        gap="24px"
        direction="column"
        width="400px"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Frame 427")}
      >
        <Text
          fontFamily="Inter"
          fontSize="20px"
          fontWeight="700"
          color="rgba(13,26,38,1)"
          lineHeight="30px"
          textAlign="left"
          display="block"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Your order")}
        >
          Your order
        </Text>
        <Image
          height="348px"
          display="block"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          objectFit="cover"
          alt=""
          {...getOverrideProps(overrides, "image")}
        />
        <Flex
          gap="262px"
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame 316")}
        >
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
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Subtotal")}
          >
            Subtotal
          </Text>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(13,26,38,1)"
            lineHeight="24px"
            textAlign="right"
            display="block"
            letterSpacing="0.01px"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "$320.00")}
          >
            $320.00
          </Text>
        </Flex>
        <Flex
          gap="273px"
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame 317")}
        >
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
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Shipping")}
          >
            Shipping
          </Text>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(13,26,38,1)"
            lineHeight="24px"
            textAlign="right"
            display="block"
            letterSpacing="0.01px"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "$15.00")}
          >
            $15.00
          </Text>
        </Flex>
        <Flex
          gap="296px"
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame 318")}
        >
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
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Taxes")}
          >
            Taxes
          </Text>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(13,26,38,1)"
            lineHeight="24px"
            textAlign="right"
            display="block"
            letterSpacing="0.01px"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "$26.80")}
          >
            $26.80
          </Text>
        </Flex>
        <Divider
          height="1px"
          shrink="0"
          alignSelf="stretch"
          size="small"
          orientation="horizontal"
          {...getOverrideProps(overrides, "Divider")}
        />
        <Flex
          gap="290px"
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame 319")}
        >
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="700"
            color="rgba(13,26,38,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Total")}
          >
            Total
          </Text>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="700"
            color="rgba(13,26,38,1)"
            lineHeight="24px"
            textAlign="right"
            display="block"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "$361.80")}
          >
            $361.80
          </Text>
        </Flex>
      </Flex>
    </Flex>
  </Flex>
  )
}
