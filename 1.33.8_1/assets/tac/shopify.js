async function applyCode(promoCode, currentUrl, utils) {
  try {
    const response = await $.ajax({
      url: currentUrl,
      type: 'POST',
      data: $('.order-summary__section--discount .edit_checkout:has(#checkout_reduction_code, #checkout_discount_code)').serialize(),
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function applyCodeAlternateCheckout(promoCode, utils) {
  // Get the serialized GraphQL data
  const serializedGraphql = JSON.parse($('meta[name=serialized-graphql]').attr('content'));
  const sessionKey = Object.keys(serializedGraphql).find((key) => Object.keys(serializedGraphql[key]).indexOf('session') > -1);
  const { merchandiseLines } = serializedGraphql[sessionKey].session.negotiate.result.buyerProposal.merchandise;

  const merchandiseData = merchandiseLines.map((line) => ({
    merchandise: {
      productVariantReference: {
        id: line.merchandise.id,
        variantId: line.merchandise.variantId,
        properties: [],
      },
    },
    quantity: { items: { value: line.quantity.items.value } },
    expectedTotalPrice: {
      value: {
        amount: line.totalAmount.value.amount,
        currencyCode: line.totalAmount.value.currencyCode,
      },
    },
  }));

  const graphqlQuery = {
    query: `query Proposal(
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
        sessionToken: $('meta[name=serialized-session-token]').attr('content').slice(1, -1),
      },
      reduction: { code: promoCode },
      merchandise: { merchandiseLines: merchandiseData },
    },
    operationName: 'Proposal',
  };

  const graphqlEndpoint = JSON.parse($('meta[name=serialized-graphql-endpoint]').attr('content'));

  try {
    const response = await $.ajax({
      url: graphqlEndpoint,
      method: 'POST',
      headers: {
        accept: 'application/json',
        'accept-language': 'en-US',
        'content-type': 'application/json',
      },
      data: JSON.stringify(graphqlQuery),
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
    const errorText = $(applyCodeResponse).find('#error-for-reduction_code, section form[method="POST"] [id*="error-for-TextField"]').text();
    if (!errorText) {
      // Update the current price
      newPrice = $(applyCodeResponse).find('.payment-due__price:first').text() || originalPrice;
    } else {
      newPrice = originalPrice;
    }
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function updatePriceAlternateCheckout(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    if (applyCodeResponse.data.session.negotiate.result.sellerProposal) {
      const runningTotal = applyCodeResponse.data.session.negotiate.result.sellerProposal.runningTotal.value.amount;
      const subtotalBeforeTaxesAndShipping = applyCodeResponse.data.session.negotiate.result.sellerProposal.subtotalBeforeTaxesAndShipping.value.amount;
      newPrice = Math.min(runningTotal, subtotalBeforeTaxesAndShipping);
    } else {
      newPrice = originalPrice;
    }
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    const formattedPrice = Number(utils.parsePrice(newPrice)).toFixed(2);
    $(cartPriceSelector).text(`$${formattedPrice}`);
  }

  return newPrice;
}

function getCurrentUrl() {
  let currentUrl = window.location.href;

  // Check if there's a discount in the URL
  const discountInUrl = currentUrl.match(/discount=[\w-]+/);
  if (discountInUrl) {
    // Remove the discount from the URL
    const startIndex = currentUrl.indexOf(discountInUrl);
    const lengthOfDiscountString = discountInUrl[0].length;
    currentUrl = currentUrl.substring(0, startIndex) + currentUrl.substring(startIndex + lengthOfDiscountString);
  }
  return currentUrl;
}

function checkCheckoutType() {
  const ALTERNATE_CHECKOUT_REGEX = /\/checkouts\/[a-z]{1,2}\/(?:c1-)?[a-z0-9A-Z]{24,}/;
  const isAlternateCheckout = window.location.href.match(ALTERNATE_CHECKOUT_REGEX);
  return isAlternateCheckout;
}

async function tacPreApply() {
  const removeButton = $('#checkout_clear_discount + button, [aria-label="Discount code"] button, button[aria-label*="Remove"]');
  if (removeButton.length) {
    removeButton.click();
  }
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const currentUrl = getCurrentUrl();
  const isAlternateCheckout = checkCheckoutType();
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  if (isAlternateCheckout) {
    const applyCodeResponse = await applyCodeAlternateCheckout(promoCode, utils);
    finalPrice = await updatePriceAlternateCheckout(applyCodeResponse, cartPriceSelector, originalPrice, utils);
  } else {
    const applyCodeResponse = await applyCode(promoCode, currentUrl, utils);
    finalPrice = updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);
  }

  if (isApplyBest) {
    window.location.reload();
    await utils.wait(1500);
  }
  // Return the current price
  return Number(utils.parsePrice(finalPrice));
}

// Expose the function to the global scope
window.tacSubmit = tacSubmit;
window.tacPreApply = tacPreApply;
