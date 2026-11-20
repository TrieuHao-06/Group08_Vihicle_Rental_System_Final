package com.thuexe.owner;

import com.thuexe.entity.RequestStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OwnerBookingRepository extends JpaRepository<OwnerBooking, Long> {

    /** Mọi đơn đặt các xe thuộc chủ xe này, mới nhất trước */
    @Query("select b from OwnerBooking b "
            + "where b.vehicleId in (select v.id from OwnerVehicle v where v.ownerId = :ownerId) "
            + "order by b.id desc")
    List<OwnerBooking> findAllOfOwner(@Param("ownerId") Long ownerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from OwnerBooking b where b.id = :id")
    Optional<OwnerBooking> findByIdForUpdate(@Param("id") Long id);

    /**
     * Các đơn cùng trạng thái của cùng xe có khoảng thời gian CHỒNG LẤN với [startTime, endTime):
     * hai khoảng chồng nhau khi  A.start < B.end  VÀ  B.start < A.end.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from OwnerBooking b "
            + "where b.vehicleId = :vehicleId and b.status = :status and b.id <> :id "
            + "and b.startTime < :endTime and b.endTime > :startTime")
    List<OwnerBooking> findOverlapping(@Param("vehicleId") Long vehicleId,
                                       @Param("status") RequestStatus status,
                                       @Param("id") Long id,
                                       @Param("startTime") LocalDateTime startTime,
                                       @Param("endTime") LocalDateTime endTime);
}
