import os
import sys
import argparse

def download_roboflow_dataset(api_key, workspace, project, version, output_dir):
    """
    Download a dataset from Roboflow Universe.
    Requires the 'roboflow' pip package.
    """
    try:
        from roboflow import Roboflow
    except ImportError:
        print("ERROR: 'roboflow' package is not installed.")
        print("Please run: pip install roboflow")
        sys.exit(1)
        
    print(f"Connecting to Roboflow... (Project: {workspace}/{project}, Version: {version})")
    rf = Roboflow(api_key=api_key)
    project_obj = rf.workspace(workspace).project(project)
    
    # Download YOLOv8 format dataset
    dataset = project_obj.version(version).download("yolov8", location=output_dir)
    print(f"Dataset downloaded successfully to {output_dir}")

def download_kaggle_dataset(dataset_name, output_dir):
    """
    Download a dataset from Kaggle.
    Requires 'kaggle' pip package and kaggle.json authentication.
    """
    try:
        import kaggle
    except ImportError:
        print("ERROR: 'kaggle' package is not installed.")
        print("Please run: pip install kaggle")
        sys.exit(1)
    
    print(f"Downloading Kaggle dataset '{dataset_name}' to '{output_dir}'...")
    kaggle.api.dataset_download_files(dataset_name, path=output_dir, unzip=True)
    print("Dataset downloaded and extracted.")

def main():
    parser = argparse.ArgumentParser(description="Download public bullet-hole datasets from online sources.")
    parser.add_argument("--source", type=str, choices=["roboflow", "kaggle"], required=True, help="Data source to use.")
    parser.add_argument("--out", type=str, default="datasets/downloaded", help="Output directory")
    
    # Roboflow args
    parser.add_argument("--rf-key", type=str, help="Roboflow API Key")
    parser.add_argument("--rf-workspace", type=str, default="project-bat-bullet-hole-detection", help="Roboflow Workspace")
    parser.add_argument("--rf-project", type=str, default="bullet-hole-object-detection", help="Roboflow Project")
    parser.add_argument("--rf-version", type=int, default=1, help="Roboflow Dataset Version")
    
    # Kaggle args
    parser.add_argument("--kaggle-name", type=str, help="Kaggle Dataset Name (e.g., 'username/dataset')")
    
    args = parser.parse_args()
    
    os.makedirs(args.out, exist_ok=True)
    
    if args.source == "roboflow":
        if not args.rf_key:
            print("ERROR: --rf-key is required for Roboflow downloads.")
            print("Get a free API key at https://universe.roboflow.com by signing in and going to your profile settings.")
            sys.exit(1)
        download_roboflow_dataset(args.rf_key, args.rf_workspace, args.rf_project, args.rf_version, args.out)
        
    elif args.source == "kaggle":
        if not args.kaggle_name:
            print("ERROR: --kaggle-name is required for Kaggle downloads.")
            sys.exit(1)
        # Note: Kaggle requires ~/.kaggle/kaggle.json to be set up.
        download_kaggle_dataset(args.kaggle_name, args.out)

if __name__ == "__main__":
    main()
