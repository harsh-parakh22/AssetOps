package com.assetops.exception;
import java.util.UUID;
public class AssetNotFoundException extends RuntimeException {
    public AssetNotFoundException(UUID id) { super("Asset not found: " + id); }
    public AssetNotFoundException(String tag) { super("Asset not found: " + tag); }
}
