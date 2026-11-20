package com.thuexe.owner;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OwnerVehicleRepository extends JpaRepository<OwnerVehicle, Long> {

    List<OwnerVehicle> findByOwnerIdOrderByIdAsc(Long ownerId);

    Optional<OwnerVehicle> findByIdAndOwnerId(Long id, Long ownerId);

    boolean existsByPlateKey(String plateKey);

    boolean existsByPlateKeyAndIdNot(String plateKey, Long id);

    /** Đọc xe và KHÓA dòng đó (SELECT ... FOR UPDATE) cho tới khi giao dịch kết thúc */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from OwnerVehicle v where v.id = :id")
    Optional<OwnerVehicle> findByIdForUpdate(@Param("id") Long id);
}
