package com.thuexe.repository;

import com.thuexe.entity.RefundRequest;
import com.thuexe.entity.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface RefundRequestRepository extends JpaRepository<RefundRequest, Long> {

    List<RefundRequest> findAllByOrderByIdDesc();

    List<RefundRequest> findByStatusOrderByIdDesc(RequestStatus status);

    long countByStatus(RequestStatus status);

    boolean existsByBookingIdAndStatus(Long bookingId, RequestStatus status);

    boolean existsByBookingIdAndStatusIn(Long bookingId, Collection<RequestStatus> statuses);

    /** Tổng tiền đã (hoặc đang) yêu cầu hoàn cho một đơn */
    @Query("select coalesce(sum(r.amount), 0L) from RefundRequest r "
            + "where r.bookingId = :bookingId and r.status in :statuses")
    long sumAmountByBooking(@Param("bookingId") Long bookingId,
                            @Param("statuses") Collection<RequestStatus> statuses);

    long countByStatusAndRequestedAtGreaterThanEqualAndRequestedAtLessThan(
            RequestStatus status, LocalDateTime from, LocalDateTime to);
}
