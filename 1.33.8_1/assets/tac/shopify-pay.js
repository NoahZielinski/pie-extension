// Constants for hard-coded strings
const APPLYING_CODE = 'Applying code';
const COUPON_APPLY_ERROR = 'Coupon Apply Error: ';

// Function to trigger input events
async function triggerInputEvents(inputElement) {
  inputElement.change().keydown().keypress().keyup().blur().focus();
}

// Function to get merchandise data
function getMerchandiseData(merchandiseLines) {
  const merchandiseData = [];
  merchandiseLines.forEach((line) => {
    const merchandiseInfo = {
      merchandise: {
        productVariantReference: {
          id: line.merchandise.id,
          variantId: line.merchandise.variantId,
          properties: [],
        },
      },
      quantity: {
        items: {
          value: line.quantity.items.value,
        },
      },
      expectedTotalPrice: {
        value: {
          amount: line.totalAmount.value.amount,
          currencyCode: line.totalAmount.value.currencyCode,
        },
      },
    };
    merchandiseData.push(merchandiseInfo);
  });
  return merchandiseData;
}

// Function to get graphql query
function getGraphqlQuery(merchandiseData, promoCode) {
  return {
    query: `
            query Proposal(
                $merchandise: MerchandiseTermInput
                $sessionInput: SessionTokenInput!
                $reduction: ReductionInput
            ) {
                session(sessionInput: $sessionInput) {
                negotiate(
                    input: {
                    purchaseProposal: { merchandise: $merchandise, reduction: $reduction }
                    }
                ) {
                    result {
                    ... on NegotiationResultAvailable {
                        buyerProposal {
                        ...BuyerProposalDetails
                        }
                        sellerProposal {
                        ...ProposalDetails
                        }
                    }
                    }
                }
                }
            }
            fragment BuyerProposalDetails on Proposal {
                merchandiseDiscount {
                ... on DiscountTermsV2 {
                    ... on FilledDiscountTerms {
                    lines {
                        ... on DiscountLine {
                        discount {
                            ... on Discount {
                            ... on CodeDiscount {
                                code
                            }
                            ... on DiscountCodeTrigger {
                                code
                            }
                            ... on AutomaticDiscount {
                                presentationLevel
                                title
                            }
                            }
                        }
                        }
                    }
                    }
                }
                }
            }
            fragment ProposalDetails on Proposal {
                subtotalBeforeTaxesAndShipping {
                ... on MoneyValueConstraint {
                    value {
                    amount
                    currencyCode
                    }
                }
                }
                runningTotal {
                ... on MoneyValueConstraint {
                    value {
                    amount
                    currencyCode
                    }
                }
                }
            }`,
    variables: {
      sessionInput: {
        sessionToken: $('meta[name="serialized-session-token"]').attr('content').slice(1, -1),
      },
      reduction: {
        code: promoCode,
      },
      merchandise: {
        merchandiseLines: merchandiseData,
      },
    },
    operationName: 'Proposal',
  };
}

// tests the code for shop.app/checkout URLs
// these requests don't actually apply the code, but they do return the new price
// actual code application is done at the end only for the best code
async function testCodeCheckout(promoCode, utils) {
  let ajaxResponse;
  try {
    const serializedGraphql = JSON.parse($('meta[name="serialized-graphql"]').attr('content'));
    const sessionKey = Object.keys(serializedGraphql).find((key) => Object.keys(serializedGraphql[key]).indexOf('session') > -1);
    const { merchandiseLines } = serializedGraphql[sessionKey].session.negotiate.result.buyerProposal.merchandise;
    const merchandiseData = getMerchandiseData(merchandiseLines);
    const graphqlQuery = getGraphqlQuery(merchandiseData, promoCode);
    const graphqlEndpoint = JSON.parse($('meta[name="serialized-graphql-endpoint"]').attr('content'));
    ajaxResponse = $.ajax({
      url: graphqlEndpoint,
      method: 'POST',
      headers: {
        accept: 'application/json',
        'accept-language': 'en-US',
        'content-type': 'application/json',
      },
      data: JSON.stringify(graphqlQuery),
    });
    await ajaxResponse
      .done(() => {
        utils.logger.debug(APPLYING_CODE);
      })
      .fail((xhr, textStatus, error) => {
        utils.logger.debug(`${COUPON_APPLY_ERROR}${error}`);
      });
  } catch (error) {
    utils.logger.debug(`${COUPON_APPLY_ERROR}${error}`);
  }
  return ajaxResponse;
}

// get the updated price for shop.app/checkout URLs
async function updatePriceCheckout(checkoutTestCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;
  try {
    newPrice = Number(utils.parsePrice(checkoutTestCodeResponse.data.session.negotiate.result.sellerProposal.runningTotal.value.amount)) || originalPrice;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(cartPriceSelector)) < originalPrice) {
    $(cartPriceSelector).text(`$${newPrice}`);
  }

  return newPrice;
}

// get the updated price for shop.app/pay URLs
async function updatePricePay(applyCodePayResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;
  try {
    newPrice = Number(utils.parsePrice(applyCodePayResponse.checkout.total_price)) || originalPrice;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(cartPriceSelector)) < originalPrice) {
    $('[aria-labelledby="order-total"] span:contains($)').text(`$${newPrice}`);
  }

  return newPrice;
}

// Function to enter coupon code
async function enterCouponCode(inputElement, promoCode, utils) {
  let index = 0;
  while (index < promoCode.length) {
    const currentValue = inputElement.val() + promoCode.charAt(index);
    inputElement.val(currentValue);
    // eslint-disable-next-line no-await-in-loop
    await triggerInputEvents(inputElement);
    index += 1;
    // eslint-disable-next-line no-await-in-loop
    await utils.wait(20);
  }
}

// Function to apply discount code
async function applyDiscountCode(promoCode, utils) {
  const discountInput = $('#add-discount, input[name="reductions"]');
  const applyButton = $('aside form button[aria-label="Apply Discount Code"]');
  discountInput.val('');
  await triggerInputEvents(discountInput);
  await enterCouponCode(discountInput, promoCode, utils);
  applyButton.removeAttr('disabled');
  await utils.wait(200);
  applyButton.click();
  await utils.wait(1000);
}

// apply code for shop.app/pay URLs
async function applyCodePay(promoCode, utils) {
  const configurationContent = $('meta[name="configuration"]').attr('content') || '';
  const shopifyDomain = (configurationContent.match('"shopify_domain":"(.*?)",') || [])[1];
  const checkoutToken = (configurationContent.match('"checkout_token":"(.*?)",') || [])[1];
  const checkoutSecret = (configurationContent.match('"checkout_secret":"(.*?)",') || [])[1];

  const ajaxResponse = $.ajax({
    url: `https://${shopifyDomain}/wallets/unstable/checkouts/${checkoutToken}.json`,
    type: 'PATCH',
    headers: {
      'content-type': 'application/json',
      'x-shopify-checkout-authorization-token': checkoutSecret,
    },
    data: JSON.stringify({
      checkout: {
        reduction_code: promoCode,
      },
    }),
  });
  await ajaxResponse
    .done(() => {
      utils.logger.debug(APPLYING_CODE);
    })
    .fail((xhr, textStatus, error) => {
      utils.logger.debug(`${COUPON_APPLY_ERROR}${error}`);
    });

  return ajaxResponse;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  // checkout URLs are either on the format shop.app/pay or shop.app/checkout
  // isCheckoutPage === true for shop.app/checkout
  const CHECKOUT_REGEX = /checkout\/\d+\/\w+\/\w+/;
  const isCheckoutPage = window.location.href.match(CHECKOUT_REGEX);
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  if (isCheckoutPage) {
    const checkoutTestCodeResponse = await testCodeCheckout(promoCode, utils);
    finalPrice = await updatePriceCheckout(checkoutTestCodeResponse, cartPriceSelector, originalPrice, utils);
    if (isApplyBest) {
      await applyDiscountCode(promoCode, utils);
      window.location = window.location.href;
      await utils.wait(400);
    }
  } else {
    const applyCodePayResponse = await applyCodePay(promoCode, utils);
    finalPrice = await updatePricePay(applyCodePayResponse, cartPriceSelector, originalPrice, utils);
    if (isApplyBest) {
      window.location = window.location.href;
      await utils.wait(300);
    }
  }
  return Number(utils.parsePrice(finalPrice));
}

window.tacSubmit = tacSubmit;
