from orchestrator import AttendanceOrchestrator

def main():
    orch = AttendanceOrchestrator(ctx_id=-1)  # ctx_id=0 for GPU

    # Register students
    orch.register("../photos/qazi.png",    "B22CS087", "Qazi Talha Ali")
    orch.register("../photos/pari.png",    "B22CS039", "Pari Sharma")
    orch.register("../photos/chinmay.png", "B22BB001", "Chinmay Vashisth")
    orch.register("../photos/vignesh.png", "B22CS099", "Vignesh Something")

    # Visualize what the model sees in the group photo
    orch.visualize("../photos/group.png", output_path="detections.jpg")

    # Mark attendance
    orch.run_pipeline("../photos/group.png")

if __name__ == "__main__":
    main()