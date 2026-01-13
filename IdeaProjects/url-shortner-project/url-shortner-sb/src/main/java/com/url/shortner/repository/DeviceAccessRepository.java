package com.url.shortner.repository;

import com.url.shortner.models.DeviceAccess;
import com.url.shortner.models.UrlMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeviceAccessRepository extends JpaRepository<DeviceAccess, Long> {
    Optional<DeviceAccess> findByUrlMappingAndDeviceFingerprint(UrlMapping urlMapping, String deviceFingerprint);
    void deleteByUrlMapping(UrlMapping urlMapping);
}

