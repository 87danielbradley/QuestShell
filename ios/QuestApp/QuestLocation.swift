import CoreLocation
import Foundation
import React

@objc(QuestLocation)
final class QuestLocation: NSObject, CLLocationManagerDelegate {
  private let locationManager = CLLocationManager()

  private var resolve: RCTPromiseResolveBlock?
  private var reject: RCTPromiseRejectBlock?
  private var didRequestLocation = false

  override init() {
    super.init()

    locationManager.delegate = self
    locationManager.desiredAccuracy = kCLLocationAccuracyBest
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    true
  }

  @objc
  func getCurrentLocation(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      self.resolve = resolve
      self.reject = reject
      self.didRequestLocation = false

      guard CLLocationManager.locationServicesEnabled() else {
        self.rejectOnce(
          code: "LOCATION_DISABLED",
          message: "Location services are disabled."
        )
        return
      }

      switch self.locationManager.authorizationStatus {
      case .notDetermined:
        self.locationManager.requestWhenInUseAuthorization()

      case .authorizedWhenInUse, .authorizedAlways:
        self.requestLocation()

      case .denied, .restricted:
        self.rejectOnce(
          code: "PERMISSION_DENIED",
          message: "Location permission was denied."
        )

      @unknown default:
        self.rejectOnce(
          code: "UNKNOWN_AUTH_STATUS",
          message: "Unknown location permission status."
        )
      }
    }
  }

  func locationManagerDidChangeAuthorization(
    _ manager: CLLocationManager
  ) {
    guard resolve != nil || reject != nil else { return }

    switch manager.authorizationStatus {
    case .authorizedWhenInUse, .authorizedAlways:
      requestLocation()

    case .denied, .restricted:
      rejectOnce(
        code: "PERMISSION_DENIED",
        message: "Location permission was denied."
      )

    case .notDetermined:
      break

    @unknown default:
      rejectOnce(
        code: "UNKNOWN_AUTH_STATUS",
        message: "Unknown location permission status."
      )
    }
  }

  func locationManager(
    _ manager: CLLocationManager,
    didUpdateLocations locations: [CLLocation]
  ) {
    guard let location = locations.last else {
      rejectOnce(
        code: "NO_LOCATION",
        message: "No location available."
      )
      return
    }

    resolveOnce([
      "lat": location.coordinate.latitude,
      "lng": location.coordinate.longitude,
      "accuracy": location.horizontalAccuracy,
      "altitude": location.verticalAccuracy >= 0
        ? location.altitude
        : NSNull(),
      "heading": location.course >= 0
        ? location.course
        : NSNull(),
      "speed": location.speed >= 0
        ? location.speed
        : NSNull(),
      "timestamp": Int64(location.timestamp.timeIntervalSince1970 * 1000)
    ])
  }

  func locationManager(
    _ manager: CLLocationManager,
    didFailWithError error: Error
  ) {
    if let clError = error as? CLError,
       clError.code == .locationUnknown {
      return
    }

    rejectOnce(
      code: "LOCATION_ERROR",
      message: error.localizedDescription
    )
  }

  private func requestLocation() {
    guard !didRequestLocation else { return }

    didRequestLocation = true
    locationManager.requestLocation()
  }

  private func resolveOnce(_ value: Any) {
    resolve?(value)
    clearCallbacks()
  }

  private func rejectOnce(code: String, message: String) {
    reject?(code, message, nil)
    clearCallbacks()
  }

  private func clearCallbacks() {
    resolve = nil
    reject = nil
    didRequestLocation = false
  }
}
