#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(QuestLocation, NSObject)

RCT_EXTERN_METHOD(
  getCurrentLocation:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
