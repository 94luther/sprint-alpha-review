"""Shim: draws THE-HOUSE.html for this folder using the brick-house skill builder. Copy into any project folder."""
import runpy, sys, os, pathlib
sys.argv = [sys.argv[0], str(pathlib.Path(__file__).parent)]
runpy.run_path(os.path.expanduser(r"~\.claude\skills\brick-house\build-house.py"), run_name="__main__")
