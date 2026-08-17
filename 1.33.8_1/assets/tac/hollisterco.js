// Function to apply a promotion code and fetch the adjustment amount
async function applyCode(promoCode, utils) {
  let storeInfoJSON = {};
  try {
    const rawStoreInfo = window.sessionStorage.getItem('customer-web-service-SignInBlockFrontend-session-context');
    const indexOfColon = rawStoreInfo.indexOf(':');
    const storeInfoString = rawStoreInfo.substring(indexOfColon + 1);
    storeInfoJSON = JSON.parse(storeInfoString);
  } catch (error) {
    utils.logger.debug('Error parsing store info');
  }
  const storeId = storeInfoJSON.storeId || '';
  const catalogId = storeInfoJSON.catalogId || '';
  const langId = storeInfoJSON.langId || '';
  const country = storeInfoJSON.country || '';
  const brand = storeInfoJSON.brand || '';
  const store = storeInfoJSON.store || '';

  const applyCodeUrl = `/api/bff/checkout?storeId=${storeId}&catalogId=${catalogId}&langId=${langId}&brand=${brand}&store=${store}&country=${country}&page=bag&filter=condensedDetails`;
  const graphqlQuery = {
    query: `mutation ApplyPromo($promotionCode: String!) {
        applyPromo(promotionCode: $promotionCode) {
          orderTotals {
            totalItemsInBag
            cartTotalAmount
            cartPayableAmount
            subTotalFmt
            promoAmount
            promoAmountFmt
            shippingHandlingChargeFmt
            totalGiftBoxes
            subTotal
            orderId
            totalGiftBoxesAmount
            isGiftReceiptChecked
            displayFreeShippingText
            displayGiftReceiptText
            estimatedTaxAmountFmt
            charityRoundUpFmt
            includesConsumptionTax
            includesGst
            includesVat
            grandTotal
            grandTotalFmt
            currency
            charityTotalFmt
            subTotalUSD
            grandTotalUSD
            cartTotalAmountUSD
            __typename
          }
          charity {
            name
            id
            brand
            sku
            option {
              id
              name
              checked
              __typename
            }
            __typename
          }
          bagItems {
            hasGiftCard
            hasOnlyGiftCard
            items {
              item {
                headers {
                  badgeStatusMessage
                  headerMessage
                  estimatedShipDate
                  shouldDisplayAsbadge
                  attached
                  fullWidth
                  textAlign
                  variant
                  __typename
                }
                footer {
                  bogoMessage
                  __typename
                }
                image {
                  altText
                  imageSrc
                  imageId
                  classList
                  __typename
                }
                imageOverlay {
                  productUrl
                  zoomIn
                  __typename
                }
                secondaryContent {
                  buttonGroup
                  __typename
                }
                productContent {
                  gender
                  name
                  size
                  brand
                  shortSku
                  longSku
                  orderItemId
                  productId
                  collectionId
                  freeGift
                  seq
                  faceOut
                  faceoutImage
                  color
                  productPrice {
                    description
                    originalPrice
                    discountPrice
                    discountText
                    variant
                    priceFlag
                    original
                    discount
                    originalUSD
                    discountUSD
                    __typename
                  }
                  promotions {
                    shortDesc
                    promotionType
                    __typename
                  }
                  deliveryDate
                  toEmail
                  editRemoveButtonVariant
                  editRemoveButton
                  hasEdit
                  hasRemove
                  isFinalSale
                  __typename
                }
                __typename
              }
              giftBox {
                isWrapped
                giftBoxMessage
                __typename
              }
              __typename
            }
            __typename
          }
          promoInfo {
            promoCompId
            promotionCode
            promotionKey
            longDesc
            isShippingPromo
            isRewardPromo
            isPromoBadging
            isImplicitPromo
            amount
            amountFmt
            orderAdjustmentId
            shortDesc
            promotionType
            __typename
          }
          responseInfo {
            statusCode
            success
            statusMessages {
              code
              key
              message
              __typename
            }
            __typename
          }
          rewardsAndPromotions {
            couponInfo {
              couponCode
              associatedPromoKey
              associatedPromoName
              formattedValue
              couponExpiryDate
              couponApplied
              offerHeaderKey
              offerHeader
              promoType
              exclusionsApplyTmntKey
              offerType
              isPromotion
              associatedPoints
              tier
              __typename
            }
            legalTermsTmntKey
            totalCoupons
            __typename
          }
          repudiationData {
            errorMessage
            repudiationType
            __typename
          }
          freeShippingProgressInfo {
            isVisible
            amountToFreeShipping
            amountToFreeShippingFmt
            preLabel
            postLabel
            progressValue
            maxProgress
            minProgress
            __typename
          }
          klarnaState {
            isEnabled
            orderInfo {
              locale
              merchant_reference1
              merchant_reference2
              order_amount
              order_lines {
                image_url
                product_url
                type
                reference
                quantity
                unit_price
                total_amount
                name
                __typename
              }
              order_tax_amount
              purchase_country
              purchase_currency
              __typename
            }
            sessionRequestBody {
              orderId
              purchaseCountry
              currency
              locale
              orderTotal
              tax
              shippingDetails {
                type
                name
                quantity
                unitPrice
                totalAmount
                __typename
              }
              items {
                type
                shortSku
                orderItemId
                quantity
                price
                offerPrice
                contractPrice
                listPrice
                name
                productUrl
                imageUrl
                adjustments {
                  shippingPromo
                  type
                  name
                  quantity
                  unitPrice
                  totalAmount
                  __typename
                }
                __typename
              }
              adjustments {
                shippingPromo
                type
                name
                quantity
                unitPrice
                totalAmount
                __typename
              }
              attributes {
                options {
                  color_details
                  color_button
                  color_button_text
                  color_checkbox
                  color_checkbox_checkmark
                  color_header
                  color_link
                  color_text
                  color_text_secondary
                  __typename
                }
                __typename
              }
              __typename
            }
            __typename
          }
          giftcards {
            id
            maskedNumber
            amount
            amountFmt
            unusedAmount
            unusedAmountFmt
            __typename
          }
          __typename
        }
      }`,
    variables: { promotionCode: promoCode },
    operationName: 'ApplyPromo',
  };

  try {
    const response = await $.ajax({
      url: applyCodeUrl,
      type: 'POST',
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
        'content-type': 'application/json',
      },
      data: JSON.stringify([graphqlQuery]),
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;
  try {
    const discount = applyCodeResponse[0].data.applyPromo.orderTotals.promoAmount;
    if (discount === 0) {
      newPrice = originalPrice;
    } else {
      newPrice = applyCodeResponse[0].data.applyPromo.orderTotals.subTotalFmt;
    }
  } catch (error) {
    utils.logger.debug('Error updating price');
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyCode(promoCode, utils);
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(200);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the tacSubmit function to the window object
window.tacSubmit = tacSubmit;
