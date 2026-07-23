'use strict';

/**
 * providers/hotels/srdv/srdv-hotel.mapper.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Request and Response Mappers for SRDV Hotel API v8.
 * Translates between Maqam domain objects and SRDV payload structures.
 */

const nightsBetween = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
};

const findHotelArray = (response) => {
  if (!response || typeof response !== 'object') return [];

  // const tryArray = (value) => (Array.isArray(value) ? value : null);
  const tryArray = (value) => (Array.isArray)(value) ? value : null;
  const looksLikeHotelArray = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0 || typeof arr[0] !== 'object') return false;
    const first = arr[0];
    return (
      'HotelCode' in first ||
      'HotelName' in first ||
      'ResultIndex' in first ||
      'HotelAddress' in first
    );
  };

  const direct = tryArray(response)
    || tryArray(response.HotelSearchResult?.HotelResults)
    || tryArray(response.HotelSearchResult?.Hotels)
    || tryArray(response.HotelSearchResult?.HotelList)
    || tryArray(response.HotelSearchResult?.HotelResult)
    || tryArray(response.HotelResults)
    || tryArray(response.Hotels)
    || tryArray(response.SearchResult?.HotelResults)
    || tryArray(response.SearchResult?.Hotels)
    || tryArray(response.SearchResult?.HotelList)
    || tryArray(response.SearchResult?.HotelResult);


  if (direct) return direct;

  // const recursiveFind = (obj, depth = 0) => {
  //   if (!obj || typeof obj !== 'object' || depth > 4) return null;
  //   for (const value of Object.values(obj)) {
  //     if (looksLikeHotelArray(value)) return value;
  //     if (value && typeof value === 'object' && !Array.isArray(value)) {
  //       const found = recursiveFind(value, depth + 1);
  //       if (found) return found;
  //     }
  //   }
  //   return null;
  // };

  const recursiveFind = (obj, depth = 0) => {
    if (!obj || typeof obj !== 'object' || depth > 4) return null;
    for (const value of Object.values(obj)) {
      if (looksLikeHotelArray(value)) return value;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const found = recursiveFind(value, depth + 1);
        if (found) return found;
      }
    }
    return null;
  };
  return recursiveFind(response) || [];
};


module.exports = {
  /**
   * Maps Maqam search criteria to SRDV Search payload
   */
  mapSearchRequest: (criteria) => {
    const nights = nightsBetween(criteria.checkIn, criteria.checkOut);
    return {
      BookingMode: 5, // Sandbox/Test booking mode
      CheckInDate: new Date(criteria.checkIn).toISOString().split('T')[0],
      NoOfNights: nights,
      CountryCode: criteria.countryCode || 'SA',
      CityId: Number(criteria.cityId),
      PreferredCurrency: criteria.currency || 'INR',
      GuestNationality: criteria.guestNationality || 'IN',
      NoOfRooms: criteria.rooms.length,
      RoomGuests: criteria.rooms.map((room) => ({
        NoOfAdults: room.adults,
        NoOfChild: room.children || 0,
        ChildAge: room.childAges || [],
      })),
      MinRating: criteria.minRating || 1,
      MaxRating: criteria.maxRating || 5,
    };
  },

  /**
   * Normalizes SRDV Search response to Maqam public hotel DTO
   */
  mapSearchResponse: (srdvResponse, criteria) => {
    const nights = nightsBetween(criteria.checkIn, criteria.checkOut);
    const rawHotels = findHotelArray(srdvResponse);

    const hotels = rawHotels.map((hotel) => {
      const priceSource = hotel.Price || hotel.MinPrice || {};
      const minPrice = parseFloat(
        priceSource.OfferedPrice ||
        priceSource.PublishedPrice ||
        priceSource.RoomPrice ||
        priceSource.Price ||
        hotel.MinPrice ||
        0,
      ) || 0;
      const currency = hotel.CurrencyCode || priceSource.CurrencyCode || criteria.currency || 'INR';

      return {
        id: hotel.HotelCode,
        name: hotel.HotelName,
        rating: Number(hotel.Rating || hotel.HotelRating || 0),
        address: hotel.Address || hotel.HotelAddress || '',
        amenities: hotel.Amenities || [],
        imageUrls: hotel.HotelPicture ? [hotel.HotelPicture] : (hotel.Images || []),
        fromPrice: {
          amountMinor: Math.round(minPrice * nights * 100), // convert to minor unit (paise)
          currency,
        },
        priceDisclosure: {
          includesTaxes: true,
          includesFees: true,
        },
      };
    });

    return {
      provider: 'srdv',
      traceId: srdvResponse.HotelSearchResult?.TraceId || srdvResponse.TraceId,
      srdvType: srdvResponse.HotelSearchResult?.SrdvType || srdvResponse.SrdvType,
      hotels,
      // We retain the raw details for server-side mapping in the cache
      _raw: rawHotels,
    };
  },

  /**
   * Maps Maqam details/room request to SRDV HotelRoom payload
   */
  mapHotelRoomRequest: (cachedHotel, searchSession) => {
    return {
      SrdvType: searchSession.srdvType,
      SrdvIndex: cachedHotel.SrdvIndex || cachedHotel.srdvIndex || 1,
      TraceId: searchSession.traceId,
      ResultIndex: cachedHotel.ResultIndex || cachedHotel.resultIndex,
      HotelCode: cachedHotel.HotelCode || cachedHotel.hotelCode || cachedHotel.id,
      HotelName: cachedHotel.HotelName || cachedHotel.hotelName || cachedHotel.name,
    };
  },

  /**
   * Normalizes SRDV HotelRoom response to Maqam room list DTO
   */
  mapHotelRoomResponse: (srdvResponse, nights) => {
    const hotelRoomsDetails = (
      srdvResponse.GetHotelRoomResult?.HotelRoomsDetails ||
      srdvResponse.GetHotelRoomResult?.hotelRoomsDetails ||
      srdvResponse.GetHotelRoomResult ||
      srdvResponse.HotelRoomResult?.HotelRoomsDetails ||
      srdvResponse.HotelRoomResult?.hotelRoomsDetails ||
      srdvResponse.HotelRoomResult ||
      srdvResponse.HotelRoomsDetails ||
      srdvResponse.hotelRoomsDetails ||
      srdvResponse.HotelRoomsDetails ||
      []
    );
    // const hotelRoomsDetails =
    //   srdvResponse.GetHotelRoomResult?.HotelRoomsDetails ||
    //   srdvResponse.HotelRoomResult?.HotelRoomsDetails ||
    //   srdvResponse.HotelRoomsDetails ||
    //   [];

    const rooms = (Array.isArray(hotelRoomsDetails) ? hotelRoomsDetails : [hotelRoomsDetails]).flatMap((category) => {
      const categoryName = category?.CategoryName || category?.RoomTypeName || category?.Category || 'Standard Room';
      const roomsArray = Array.isArray(category?.Rooms)
        ? category.Rooms
        : Array.isArray(category?.Room)
          ? category.Room
          : Array.isArray(category?.RoomList)
            ? category.RoomList
            : [];
      return roomsArray.map((room) => {
        const offeredPrice = parseFloat(room.Price?.OfferedPrice || room.OfferedPrice || 0);
        return {
          id: room.RoomIndex || room.RoomId || `${room.RatePlanCode || room.RatePlan || categoryName}`,
          name: room.RoomTypeName || room.RoomName || categoryName,
          board: room.MealType || room.Meal || 'No meals included',
          capacity: room.MaxOccupancy || room.AdultCount || 2,
          price: offeredPrice, // Base price in major units
          totalPrice: Math.round(offeredPrice * nights),
          currency: room.Price?.CurrencyCode || 'INR',
          refundable: !!room.IsRefundable,
          cancellationPolicy: room.CancellationPolicies ? JSON.stringify(room.CancellationPolicies) : 'Standard cancellation policy applies.',
          // Retain SRDV specific details needed for BlockRoom / Book
          srdvRoomDetails: room,
        };
      });
    });

    const rawRooms = rooms.map((room) => room.srdvRoomDetails);

    return {
      rooms,
      _raw: rawRooms,
    };
  },

  /**
   * Maps Maqam recheck request to SRDV BlockRoom payload
   */
  mapBlockRoomRequest: (cachedRoomDetails, cachedHotel, searchSession) => {
    return {
      SrdvType: searchSession.srdvType,
      SrdvIndex: cachedHotel.SrdvIndex || cachedHotel.srdvIndex || 1,
      TraceId: searchSession.traceId,
      ResultIndex: cachedHotel.ResultIndex || cachedHotel.resultIndex,
      HotelCode: cachedHotel.HotelCode || cachedHotel.hotelCode || cachedHotel.id,
      HotelName: cachedHotel.HotelName || cachedHotel.hotelName || cachedHotel.name,
      // BlockRoom requires the exact selected rooms array structure
      HotelRoomsDetails: cachedRoomDetails.map((r) => r.srdvRoomDetails),
    };
  },

  /**
   * Normalizes SRDV BlockRoom response to Maqam block/recheck DTO
   */

  mapBlockRoomResponse: (srdvResponse, hotelCard, nights) => {
    const result = srdvResponse.BlockRoomResult || srdvResponse;
    const roomDetails = result.HotelRoomsDetails || [];

    const roomSnapshots = roomDetails.map((room) => {
      const offeredPrice = parseFloat(room.Price?.OfferedPrice || room.OfferedPrice || 0);
      return {
        id: room.RoomIndex || String(room.RoomIndex),
        name: room.RoomTypeName || room.RoomName || 'Standard Room',
        board: room.MealType || room.Meal || 'No meals included',
        capacity: room.MaxOccupancy || 2,
        price: offeredPrice,
        totalPrice: Math.round(offeredPrice * nights),
        currency: room.Price?.CurrencyCode || 'INR',
        refundable: !!room.IsRefundable,
        cancellationPolicy: room.CancellationPolicy || 'Standard cancellation policy applies.',
        srdvRoomDetails: room,
      };
    });

    const totalOfferedPrice = roomSnapshots.reduce((sum, r) => sum + r.totalPrice, 0);

    return {
      provider: 'srdv',
      providerReference: result.BookingRefNo || result.TraceId,
      hotel: hotelCard,
      roomSnapshots,
      price: {
        currency: roomSnapshots[0]?.currency || 'INR',
        total: totalOfferedPrice,
      },
      cancellationPolicy: roomSnapshots.map((r) => r.cancellationPolicy),
      priceChanged: !!result.IsPriceChanged,
      policyChanged: !!result.IsCancellationPolicyChanged,
      _raw: result,
    };
  },

  /**
   * Maps Maqam book request to SRDV Book payload
   */
  mapBookRequest: (bookingDoc, recheckSnapshot = null) => {
    const rawRecheck = recheckSnapshot ? (recheckSnapshot._raw || {}) : {};
    const traceId = bookingDoc.traceId;
    const srdvType = bookingDoc.srdvType;
    const resultIndex = bookingDoc.resultIndex;
    const srdvIndex = bookingDoc.srdvIndex;

    // Convert guests to SRDV Passenger structure
    const passengers = bookingDoc.guests.map((g, index) => ({
      Title: g.title || 'Mr',
      FirstName: g.firstName,
      LastName: g.lastName,
      Phoneno: g.phone || bookingDoc.guests[0].phone || '0000000000',
      Email: g.email || bookingDoc.guests[0].email || 'guest@maqam.com',
      PaxType: g.type === 'child' ? 2 : 1,
      LeadPassenger: index === 0 ? 1 : 0,
      Age: g.age || (g.type === 'child' ? 10 : 30),
    }));

    const rooms = recheckSnapshot ? recheckSnapshot.roomSnapshots : bookingDoc.roomSnapshots;

    return {
      SrdvType: srdvType,
      SrdvIndex: srdvIndex || 1,
      TraceId: traceId,
      ResultIndex: resultIndex,
      HotelCode: bookingDoc.srdvHotelId,
      HotelName: bookingDoc.hotelName,
      IsVoucherBooking: true, // Auto-voucher upon success
      HotelRoomsDetails: rooms.map((r) => r.srdvRoomDetails || r),
      HotelPassenger: passengers,
    };
  },

  /**
   * Normalizes SRDV Book response to Maqam book DTO
   */
  mapBookResponse: (srdvResponse) => {
    const result = srdvResponse.BookResult || srdvResponse;

    const isSuccess = result.BookingStatus === 'Confirmed' || result.VoucherStatus === true || result.VoucherStatus === 'true';
    const isPending = result.BookingStatus === 'Pending';

    let status = 'failed';
    if (isSuccess) status = 'confirmed';
    else if (isPending) status = 'pending';

    return {
      status,
      providerBookingId: result.BookingId ? String(result.BookingId) : null,
      bookingRefNo: result.BookingRefNo || null,
      confirmationNo: result.ConfirmationNo || null,
      invoiceNumber: result.InvoiceNumber || null,
      voucherStatus: !!result.VoucherStatus,
      failureReason: result.Error?.ErrorMessage || result.ErrorMessage || null,
      raw: result,
    };
  },

  /**
   * Normalizes SRDV HotelBookingDetail response
   */
  mapBookingDetailResponse: (srdvResponse) => {
    const result = srdvResponse.BookingDetailResult || srdvResponse;

    const isSuccess = result.BookingStatus === 'Confirmed' || result.VoucherStatus === true || result.VoucherStatus === 'true';
    const isFailed = result.BookingStatus === 'Cancelled' || result.BookingStatus === 'Rejected' || result.BookingStatus === 'Failed';

    let status = 'pending';
    if (isSuccess) status = 'confirmed';
    else if (isFailed) status = 'failed';

    return {
      status,
      providerBookingId: result.BookingId ? String(result.BookingId) : null,
      bookingRefNo: result.BookingRefNo || null,
      confirmationNo: result.ConfirmationNo || null,
      invoiceNumber: result.InvoiceNumber || null,
      voucherStatus: !!result.VoucherStatus,
      failureReason: result.Error?.ErrorMessage || result.ErrorMessage || null,
      raw: result,
    };
  },

  /**
   * Maps Maqam cancel request to SRDV HotelCancel payload
   */
  mapCancelRequest: (bookingDoc) => {
    return {
      BookingId: Number(bookingDoc.providerBookingId),
      BookingRefNo: bookingDoc.bookingRefNo,
      CancelRequestType: 3, // Full cancellation
    };
  },

  /**
   * Normalizes SRDV HotelCancel response
   */
  mapCancelResponse: (srdvResponse) => {
    const result = srdvResponse.CancelResult || srdvResponse;

    const isCancelled = result.RefundStatus === 'Processed' || result.RefundStatus === 'Refunded' || result.Status === 'Cancelled' || result.CancellationStatus === 'Cancelled';

    return {
      status: isCancelled ? 'cancelled' : 'failed',
      cancellationReference: result.ChangeRequestId || result.CancellationRefNo || null,
      penalty: parseFloat(result.CancellationCharges || result.CancellationCharge || 0),
      raw: result,
    };
  },
};
