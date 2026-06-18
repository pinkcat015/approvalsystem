package com.approval.repository;

import com.approval.entity.Delegation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DelegationRepository extends JpaRepository<Delegation, Long> {

    List<Delegation> findByFromUserIdOrderByIdDesc(Long fromUserId);

    List<Delegation> findByToUserIdOrderByIdDesc(Long toUserId);

    @Query("SELECT d FROM Delegation d WHERE d.fromUser.id = :fromUserId " +
           "AND d.active = true AND :now >= d.startDate AND :now <= d.endDate")
    List<Delegation> findActiveDelegationByFromUser(
            @Param("fromUserId") Long fromUserId,
            @Param("now") LocalDateTime now
    );
}
