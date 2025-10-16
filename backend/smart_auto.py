#!/usr/bin/env python3
import time
import os
import glob
import pandas as pd
import json
import webbrowser
import sys
from datetime import datetime
from pathlib import Path

# Configuration
CSV_URL = "https://script.google.com/a/macros/valeo.com/s/AKfycbz-3D0Byh829DNwUCvMwsxhP6tKkjt3JFv50-2rwBczTXDz6jXVCe2GqjqL8jItRkyg/exec"
DOWNLOADS_FOLDER = r"C:\Users\kmunusa1\Downloads"
OUTPUT_CSV = "../project_data_new.csv"
OUTPUT_JSON = "../project_data_new.json"
CHECK_INTERVAL = 3600  # 1 hour (in seconds)

# Check if running in manual mode (from server.js)
MANUAL_MODE = '--manual' in sys.argv

def find_latest_csv():
    """Find the most recently modified CSV file"""
    csv_files = glob.glob(os.path.join(DOWNLOADS_FOLDER, "Sheet1*.csv"))
    if not csv_files:
        return None
    return max(csv_files, key=os.path.getmtime)

def cleanup_old_csv_files():
    """
    Delete all old CSV files in Downloads folder, keeping only the most recent one.
    Returns: (deleted_count, kept_file_name)
    """
    csv_files = glob.glob(os.path.join(DOWNLOADS_FOLDER, "Sheet1*.csv"))
    
    if len(csv_files) <= 1:
        # No cleanup needed if there's 0 or 1 file
        if csv_files:
            return 0, Path(csv_files[0]).name
        return 0, None
    
    # Sort files by modification time (newest first)
    csv_files.sort(key=os.path.getmtime, reverse=True)
    
    # Keep the most recent file (first in sorted list)
    latest_file = csv_files[0]
    files_to_delete = csv_files[1:]
    
    # Delete old files
    deleted_count = 0
    for old_file in files_to_delete:
        try:
            os.remove(old_file)
            deleted_count += 1
            print(f"  DELETED: {Path(old_file).name}")
        except Exception as e:
            print(f"  WARNING: Could not delete {Path(old_file).name}: {str(e)}")
    
    return deleted_count, Path(latest_file).name

def process_csv(file_path):
    """Read CSV, rename columns, and save to dashboard files"""
    # Read CSV
    df = pd.read_csv(file_path)
    
    # Rename columns to match dashboard
    df = df.rename(columns={
        df.columns[0]: 'Designer Name',
        'Designers': 'Designer Name',
        'Team Name': 'Team Name',
        'Started Date & Time': 'Start Date',
        'Ended Date & Time': 'End Date',
        'Actual Avaliability Hrs': 'Actual Hours',
        'Raised BM Hrs': 'Raised Benchmarking Hours'
    })
    
    # Remove empty columns
    df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
    df = df.dropna(axis=1, how='all')
    
    # Add missing column if needed
    if 'Raised Benchmarking Hours' not in df.columns:
        df['Raised Benchmarking Hours'] = 0
    
    # Save to CSV
    df.to_csv(OUTPUT_CSV, index=False)
    
    # Save to JSON
    data_dict = df.to_dict('records')
    json_data = {
        "success": True,
        "data": data_dict,
        "count": len(data_dict),
        "timestamp": datetime.now().isoformat()
    }
    
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=2)
    
    return len(df)

if MANUAL_MODE:
    # MANUAL MODE: Run once and exit
    print("=" * 70)
    print("MANUAL REFRESH MODE - Running once")
    print("=" * 70)
    
    try:
        # Step 1: Open URL in browser
        print("Opening Google Sheets URL...")
        webbrowser.open_new_tab(CSV_URL)
        
        # Step 2: Wait for download (8 seconds for safety)
        print("Waiting 5 seconds for download...")
        time.sleep(5)
        
        # Step 3: Find latest CSV
        latest_file = find_latest_csv()
        
        if not latest_file:
            print("ERROR: No CSV files found")
            sys.exit(1)
        
        print(f"SUCCESS: Found {Path(latest_file).name}")
        
        # Step 4: Process the file
        print("Processing CSV...")
        record_count = process_csv(latest_file)
        
        print(f"SUCCESS: Saved {record_count} records to dashboard")
        
        # Step 5: Cleanup old CSV files
        print("Cleaning up old CSV files...")
        deleted_count, kept_file = cleanup_old_csv_files()
        if deleted_count > 0:
            print(f"SUCCESS: Deleted {deleted_count} old CSV file(s), kept {kept_file}")
        else:
            print(f"INFO: No old files to delete")
        
        print("=" * 70)
        sys.exit(0)  # Success
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        print("=" * 70)
        sys.exit(1)  # Failure

else:
    # AUTOMATIC MODE: Run continuously every hour    print("=" * 70)
    print("SMART AUTO-UPDATER - Dashboard CSV Processor")
    print("=" * 70)
    print(f"Downloads folder: {DOWNLOADS_FOLDER}")
    print(f"CSV URL: {CSV_URL}")
    print(f"Update interval: 1 hour ({CHECK_INTERVAL} seconds)")
    print("=" * 70)
    print()
    
    last_processed_file = None
    last_processed_time = None
    cycle_count = 0

    while True:
        try:
            cycle_count += 1
            current_time = datetime.now().strftime('%H:%M:%S')
            
            print(f"\n[{current_time}] Cycle #{cycle_count}")
            print("-" * 70)
            
            # Step 1: Open URL in browser
            print("  Opening URL in browser...")
            webbrowser.open_new_tab(CSV_URL)
            
            # Step 2: Wait for download
            print("  Waiting 5 seconds for download...")
            time.sleep(5)
            
            # Step 3: Find latest CSV
            latest_file = find_latest_csv()
            
            if not latest_file:
                print("  WARNING: No CSV files found in Downloads folder")
            else:
                file_name = Path(latest_file).name
                file_time = os.path.getmtime(latest_file)
                file_mod_time = datetime.fromtimestamp(file_time).strftime('%H:%M:%S')
                  # Check if it's a new file
                is_new = (last_processed_file != latest_file or 
                         last_processed_time is None or 
                         file_time > last_processed_time)
                
                if is_new:
                    print(f"  SUCCESS: New file detected: {file_name}")
                    print(f"     Modified at: {file_mod_time}")
                    
                    # Process the file
                    print("  Processing CSV...")
                    record_count = process_csv(latest_file)
                    
                    print(f"  SAVED: {record_count} records to dashboard")
                    print(f"  SUCCESS: Dashboard updated successfully!")
                    
                    # Cleanup old CSV files
                    print("  Cleaning up old CSV files...")
                    deleted_count, kept_file = cleanup_old_csv_files()
                    if deleted_count > 0:
                        print(f"  CLEANED: Deleted {deleted_count} old CSV file(s), kept {kept_file}")
                    else:
                        print(f"  INFO: No old files to delete")
                    
                    last_processed_file = latest_file
                    last_processed_time = file_time
                else:
                    print(f"  SKIP: No new file (last: {file_name} @ {file_mod_time})")
            
            # Step 4: Wait before next cycle
            print(f"  WAITING: Next check in {CHECK_INTERVAL} seconds...")
            time.sleep(CHECK_INTERVAL)
            
        except KeyboardInterrupt:
            print("\n\nSTOPPED: Stopped by user")
            break
        except Exception as e:
            print(f"  ERROR: {str(e)}")
            time.sleep(CHECK_INTERVAL)

    print("=" * 70)
    print("Auto-updater stopped")
    print("=" * 70)
